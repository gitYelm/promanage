import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL')

    // 连接池配置
    const pool = new Pool({
      connectionString,
      max: configService.get<number>('DB_POOL_MAX', 20), // 最大连接数
      idleTimeoutMillis: configService.get<number>('DB_POOL_IDLE_TIMEOUT', 30000), // 空闲超时 30s
      connectionTimeoutMillis: configService.get<number>('DB_POOL_CONNECTION_TIMEOUT', 5000), // 连接超时 5s
    })

    const adapter = new PrismaPg(pool)

    super({
      adapter,
      log: ['warn', 'error'],
    })
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
