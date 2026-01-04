import { Injectable } from '@nestjs/common';
import { QueryOnlineDto } from './dto/query-online.dto';
import { LoggerService } from '../../common/logger/logger.service';
import { IpUtil } from '../../common/utils/ip.util';
import { RedisService } from '../../redis/redis.service';

export interface OnlineUser {
  token: string;
  userName: string;
  ipaddr: string;
  loginTime: Date | string;
  browser?: string;
  os?: string;
  /** 过期时间（秒），与 JWT 过期时间一致 */
  ttl?: number;
}

const ONLINE_KEY_PREFIX = 'online:user:';
const ONLINE_SET_KEY = 'online:users';
/** 默认会话超时时间（秒），实际由调用方传入 ttl */
const DEFAULT_SESSION_TIMEOUT = 30 * 60;

/**
 * 在线用户服务
 *
 * 存储模式由 REDIS_ENABLED 环境变量控制：
 * - REDIS_ENABLED=true：使用真实 Redis 存储，支持多实例共享
 * - REDIS_ENABLED=false：使用内存模式（InMemoryRedisClient），重启后数据丢失
 *
 * 通过 RedisService 统一封装，无需在此处判断模式
 */
@Injectable()
export class OnlineService {
  constructor(
    private logger: LoggerService,
    private redis: RedisService,
  ) {}

  async add(user: OnlineUser) {
    const client = this.redis.getClient();
    const key = ONLINE_KEY_PREFIX + user.token;
    const { ttl, ...userData } = user;
    const data = JSON.stringify({
      ...userData,
      loginTime:
        user.loginTime instanceof Date
          ? user.loginTime.toISOString()
          : user.loginTime,
    });

    // 使用调用方传入的 ttl（来自 SecurityConfigService），否则使用默认值
    const expireSeconds = ttl || DEFAULT_SESSION_TIMEOUT;

    // 存储用户信息（带过期时间），并添加到在线用户集合
    await client.setex(key, expireSeconds, data);
    await client.sadd(ONLINE_SET_KEY, user.token);

    this.logger.debug(
      `用户上线: ${user.userName} (IP: ${user.ipaddr}, TTL: ${expireSeconds}s)`,
      'OnlineService',
    );
  }

  async remove(token: string) {
    const client = this.redis.getClient();
    const key = ONLINE_KEY_PREFIX + token;

    // 获取用户信息用于日志
    const data = await client.get(key);
    if (data) {
      const user = JSON.parse(data) as OnlineUser;
      this.logger.debug(`用户下线: ${user.userName}`, 'OnlineService');
    }

    // 删除用户信息和集合中的记录
    const multi = client.multi();
    multi.del(key);
    multi.srem(ONLINE_SET_KEY, token);
    await multi.exec();
  }

  async list(query?: QueryOnlineDto): Promise<{ total: number; rows: any[] }> {
    const client = this.redis.getClient();

    // 获取所有在线用户 token
    const tokens = await client.smembers(ONLINE_SET_KEY);
    if (!tokens.length) {
      return { total: 0, rows: [] };
    }

    // 批量获取用户信息
    const pipeline = client.pipeline();
    for (const token of tokens) {
      pipeline.get(ONLINE_KEY_PREFIX + token);
    }
    const results = await pipeline.exec();

    // 解析用户数据，过滤掉已失效的
    let rows: OnlineUser[] = [];
    const invalidTokens: string[] = [];

    if (results) {
      for (let i = 0; i < results.length; i++) {
        const [, data] = results[i];
        if (data) {
          rows.push(JSON.parse(data as string) as OnlineUser);
        } else {
          // 数据不存在，标记为无效
          invalidTokens.push(tokens[i]);
        }
      }
    }

    // 清理无效的 token
    if (invalidTokens.length > 0) {
      const multi = client.multi();
      for (const token of invalidTokens) {
        multi.srem(ONLINE_SET_KEY, token);
      }
      await multi.exec();
    }

    // 过滤
    if (query?.userName) {
      rows = rows.filter((x) => x.userName.includes(query.userName || ''));
    }
    if (query?.ipaddr) {
      rows = rows.filter((x) => x.ipaddr.includes(query.ipaddr || ''));
    }

    // 分页
    const pageNum = Number(query?.pageNum ?? 1);
    const pageSize = Number(query?.pageSize ?? 20);
    const total = rows.length;
    const start = (pageNum - 1) * pageSize;
    const end = start + pageSize;

    const now = Date.now();
    const pageRows = rows
      .sort((a, b) => +new Date(b.loginTime) - +new Date(a.loginTime))
      .slice(start, end)
      .map((r) => {
        const loginTimeMs = new Date(r.loginTime).getTime();
        const durationMs = now - loginTimeMs;
        return {
          tokenId: r.token,
          userName: r.userName,
          ipaddr: r.ipaddr,
          loginLocation: IpUtil.getLocation(r.ipaddr),
          browser: r.browser ?? '',
          os: r.os ?? '',
          loginTime:
            r.loginTime instanceof Date
              ? r.loginTime.toISOString()
              : String(r.loginTime),
          /** 在线时长（毫秒） */
          onlineDuration: durationMs > 0 ? durationMs : 0,
        };
      });

    return { total, rows: pageRows };
  }
}
