import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TokenBlacklistService {
  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  private key(token: string) {
    return `jwt:blacklist:${token}`;
  }

  /**
   * 将 Token 加入黑名单
   * TTL 根据 Token 的实际过期时间计算，只保留到 Token 原本过期的时间点
   */
  async add(token: string) {
    if (!token) return;

    // 解析 Token 获取过期时间
    let ttl = 60; // 默认最小 60 秒
    try {
      const decoded = this.jwtService.decode(token);
      if (
        decoded &&
        typeof decoded === 'object' &&
        'exp' in decoded &&
        typeof (decoded as { exp: unknown }).exp === 'number'
      ) {
        const exp = (decoded as { exp: number }).exp;
        const now = Math.floor(Date.now() / 1000);
        const remaining = exp - now;
        // 只有 Token 还未过期才需要加入黑名单
        if (remaining > 0) {
          ttl = remaining;
        }
      }
    } catch {
      // 解析失败使用默认 TTL
    }

    const client = this.redis.getClient();
    await client.setex(this.key(token), ttl, '1');
  }

  async isBlacklisted(token: string) {
    if (!token) return false;
    const client = this.redis.getClient();
    const exists = await client.exists(this.key(token));
    return exists === 1;
  }
}
