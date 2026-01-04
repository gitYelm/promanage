import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { generateUuid } from '../common/utils/uuid.util';

// svg-captcha 没有类型定义
/* eslint-disable @typescript-eslint/no-require-imports */
const svgCaptcha: {
  create: (options: {
    size?: number;
    ignoreChars?: string;
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
  }) => { text: string; data: string };
} = require('svg-captcha');
/* eslint-enable @typescript-eslint/no-require-imports */

const CAPTCHA_PREFIX = 'captcha:';
const CAPTCHA_EXPIRE = 300; // 5分钟过期

@Injectable()
export class CaptchaService {
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  /**
   * 生成验证码
   */
  async generate(): Promise<{ uuid: string; img: string }> {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1il',
      noise: 2,
      color: true,
      background: '#f0f0f0',
      width: 120,
      height: 40,
    });

    const uuid = generateUuid();
    const key = CAPTCHA_PREFIX + uuid;

    // 存储验证码到 Redis，5分钟过期
    await this.redis
      .getClient()
      .setex(key, CAPTCHA_EXPIRE, captcha.text.toLowerCase());

    // 返回 base64 编码的 SVG
    const img =
      'data:image/svg+xml;base64,' +
      Buffer.from(captcha.data).toString('base64');

    return { uuid, img };
  }

  /**
   * 验证验证码
   */
  async verify(uuid: string, code: string): Promise<boolean> {
    if (!uuid || !code) return false;

    const key = CAPTCHA_PREFIX + uuid;
    const storedCode = await this.redis.getClient().get(key);

    if (!storedCode) return false;

    // 验证后删除，防止重复使用
    void this.redis.getClient().del(key);

    return storedCode === code.toLowerCase();
  }

  /**
   * 检查验证码是否启用
   */
  async isCaptchaEnabled(): Promise<boolean> {
    const config = await this.prisma.sysConfig.findFirst({
      where: { configKey: 'sys.account.captchaEnabled' },
    });
    return config?.configValue === 'true';
  }
}
