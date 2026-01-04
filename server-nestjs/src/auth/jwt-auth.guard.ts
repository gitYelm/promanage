import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklistService } from './token-blacklist.service';
import { SecurityConfigService } from './security-config.service';
import { UserStatusService } from './user-status.service';
import type { ExecutionContext } from '@nestjs/common';
import type { Response, Request } from 'express';

interface JwtPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

// 宽限期：token 过期后仍可刷新的时间（秒）
const GRACE_PERIOD_SECONDS = 60;

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<
      Request & {
        headers: Record<string, string>;
        user?: JwtPayload;
      }
    >();
    const res = context.switchToHttp().getResponse<Response>();
    const auth = req.headers?.['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : '';

    // 调试日志：检查 Authorization header 是否存在
    if (!auth) {
      this.logger.warn(`[${req.url}] 请求缺少 Authorization header`);
    } else {
      this.logger.debug(
        `[${req.url}] Authorization header 存在，长度: ${auth.length}`,
      );
    }

    // 检查 token 是否在黑名单中
    const blacklist = this.moduleRef.get(TokenBlacklistService, {
      strict: false,
    });
    if (blacklist && token && (await blacklist.isBlacklisted(token))) {
      throw new UnauthorizedException('您的登录已失效，请重新登录');
    }

    // 解码 token 获取用户 ID，检查用户状态
    const jwtService = this.moduleRef.get(JwtService, { strict: false });
    if (jwtService && token) {
      try {
        const decoded = jwtService.decode(token);
        if (decoded?.sub) {
          const userStatusService = this.moduleRef.get(UserStatusService, {
            strict: false,
          });
          if (userStatusService) {
            const isInvalid = await userStatusService.isUserInvalid(
              decoded.sub,
            );
            if (isInvalid) {
              throw new UnauthorizedException('用户已被删除或停用，请重新登录');
            }
          }
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        // 解码失败不影响后续验证
      }
    }

    // 在验证前先解码 token，检查是否在宽限期内
    const refreshedToken = await this.tryRefreshExpiredToken(token, res);
    if (refreshedToken) {
      // 用新 token 替换请求头，让后续验证通过
      req.headers['authorization'] = `Bearer ${refreshedToken}`;
    }

    let ok: boolean;
    try {
      ok = (await super.canActivate(context)) as boolean;
    } catch (error) {
      const err = error as Error;
      this.logger.error(`[${req.url}] JWT 验证失败: ${err.message}`);
      throw error;
    }

    // 滑动过期：检查 Token 是否快过期，如果是则刷新
    await this.checkAndRefreshToken(req.user, res);

    return ok;
  }

  /**
   * 尝试刷新已过期的 Token（宽限期内）
   * 如果 token 刚过期（在宽限期内），签发新 token 并返回
   */
  private async tryRefreshExpiredToken(
    token: string,
    res: Response,
  ): Promise<string | null> {
    if (!token) return null;

    try {
      const jwtService = this.moduleRef.get(JwtService, { strict: false });
      const securityConfig = this.moduleRef.get(SecurityConfigService, {
        strict: false,
      });

      if (!jwtService || !securityConfig) return null;

      // 解码 token（不验证签名和过期时间）
      const decoded: unknown = jwtService.decode(token);
      if (
        !decoded ||
        typeof decoded !== 'object' ||
        !('exp' in decoded) ||
        !('sub' in decoded)
      ) {
        return null;
      }
      const payload = decoded as JwtPayload;
      if (!payload.exp || !payload.sub) return null;

      const now = Math.floor(Date.now() / 1000);
      const expiredSeconds = now - payload.exp;

      // 如果 token 已过期但在宽限期内，签发新 token
      if (expiredSeconds > 0 && expiredSeconds <= GRACE_PERIOD_SECONDS) {
        this.logger.debug(
          `Token 已过期 ${expiredSeconds} 秒，在宽限期内，尝试刷新`,
        );

        // 验证 token 签名（忽略过期时间）
        try {
          jwtService.verify(token, { ignoreExpiration: true });
        } catch {
          // 签名无效，不刷新
          return null;
        }

        const sessionTimeout = await securityConfig.getSessionTimeoutSeconds();
        const newToken = jwtService.sign(
          { sub: payload.sub, username: payload.username },
          { expiresIn: sessionTimeout },
        );

        // 通过响应头返回新 Token
        res.setHeader('X-New-Token', newToken);
        this.logger.debug('Token 已在宽限期内刷新');

        return newToken;
      }
    } catch (error) {
      this.logger.debug(`尝试刷新过期 token 失败: ${(error as Error).message}`);
    }

    return null;
  }

  /**
   * 检查并刷新 Token（滑动过期）
   * 刷新阈值为会话超时时间的 1/6（如 30 分钟超时则剩余 5 分钟时刷新）
   */
  private async checkAndRefreshToken(
    user: JwtPayload | undefined,
    res: Response,
  ): Promise<void> {
    if (!user?.exp) return;

    // 如果已经刷新过（宽限期刷新），跳过
    if (res.getHeader('X-New-Token')) return;

    try {
      const jwtService = this.moduleRef.get(JwtService, { strict: false });
      const securityConfig = this.moduleRef.get(SecurityConfigService, {
        strict: false,
      });

      if (!jwtService || !securityConfig) return;

      const sessionTimeout = await securityConfig.getSessionTimeoutSeconds();
      // 刷新阈值为会话超时时间的 1/6
      const refreshThreshold = Math.floor(sessionTimeout / 6);

      const now = Math.floor(Date.now() / 1000);
      const remaining = user.exp - now;

      // 如果剩余时间少于阈值，签发新 Token
      if (remaining > 0 && remaining < refreshThreshold) {
        const newToken = jwtService.sign(
          { sub: user.sub, username: user.username },
          { expiresIn: sessionTimeout },
        );
        // 通过响应头返回新 Token
        res.setHeader('X-New-Token', newToken);
      }
    } catch {
      // 刷新失败不影响正常请求
    }
  }
}
