import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export interface TableStats {
  tableName: string
  rowCount: number
  totalSize: string
  dataSize: string
  indexSize: string
}

export interface SlowQuery {
  query: string
  calls: number
  totalTime: string
  avgTime: string
  maxTime: string
}

export interface ConnectionInfo {
  pid: number
  state: string
  query: string
  clientAddr: string
  backendStart: string | null
  queryStart: string | null
}

@Injectable()
export class DatabaseService {
  constructor(private prisma: PrismaService) {}

  async getInfo() {
    const [version, dbSize, connectionStats, tableStats, activeConnections] = await Promise.all([
      this.getVersion(),
      this.getDatabaseSize(),
      this.getConnectionStats(),
      this.getTableStats(),
      this.getActiveConnections(),
    ])

    // 尝试获取慢查询（需要 pg_stat_statements 扩展）
    let slowQueries: SlowQuery[] = []
    try {
      slowQueries = await this.getSlowQueries()
    } catch {
      // pg_stat_statements 扩展未启用
    }

    return {
      database: {
        version,
        size: dbSize,
        name: await this.getDatabaseName(),
      },
      connections: connectionStats,
      tables: tableStats,
      activeConnections,
      slowQueries,
    }
  }

  private async getVersion(): Promise<string> {
    const result = await this.prisma.$queryRaw<[{ version: string }]>`
      SELECT version()
    `
    // 提取简短版本信息
    const full = result[0].version
    const match = full.match(/PostgreSQL ([\d.]+)/)
    return match ? `PostgreSQL ${match[1]}` : full
  }

  private async getDatabaseName(): Promise<string> {
    const result = await this.prisma.$queryRaw<[{ current_database: string }]>`
      SELECT current_database()
    `
    return result[0].current_database
  }

  private async getDatabaseSize(): Promise<string> {
    const result = await this.prisma.$queryRaw<[{ size: string }]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `
    return result[0].size
  }

  private async getConnectionStats() {
    const result = await this.prisma.$queryRaw<
      [{ max_connections: string; active: bigint; idle: bigint; total: bigint }]
    >`
      SELECT 
        current_setting('max_connections') as max_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) as total
      FROM pg_stat_activity
      WHERE datname = current_database()
    `

    const stats = result[0]
    const maxConn = parseInt(stats.max_connections, 10)
    const total = Number(stats.total)

    return {
      max: maxConn,
      active: Number(stats.active),
      idle: Number(stats.idle),
      total,
      usage: maxConn ? +((total / maxConn) * 100).toFixed(2) : 0,
    }
  }

  private async getTableStats(): Promise<TableStats[]> {
    const result = await this.prisma.$queryRaw<
      Array<{
        table_name: string
        row_count: bigint
        total_size: string
        data_size: string
        index_size: string
      }>
    >`
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(relid)) as total_size,
        pg_size_pretty(pg_relation_size(relid)) as data_size,
        pg_size_pretty(pg_indexes_size(relid)) as index_size
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 20
    `

    return result.map((row) => ({
      tableName: row.table_name,
      rowCount: Number(row.row_count),
      totalSize: row.total_size,
      dataSize: row.data_size,
      indexSize: row.index_size,
    }))
  }

  private async getActiveConnections(): Promise<ConnectionInfo[]> {
    const result = await this.prisma.$queryRaw<
      Array<{
        pid: number
        state: string | null
        query: string | null
        client_addr: string | null
        backend_start: Date | null
        query_start: Date | null
      }>
    >`
      SELECT 
        pid,
        state,
        LEFT(query, 150) as query,
        COALESCE(client_addr::text, 'local') as client_addr,
        backend_start,
        query_start
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY 
        CASE WHEN state = 'active' THEN 0 ELSE 1 END,
        query_start DESC NULLS LAST
      LIMIT 20
    `

    return result.map((row) => ({
      pid: row.pid,
      state: row.state || 'unknown',
      query: row.query || '-',
      clientAddr: row.client_addr || 'local',
      backendStart: row.backend_start?.toISOString() || null,
      queryStart: row.query_start?.toISOString() || null,
    }))
  }

  private async getSlowQueries(): Promise<SlowQuery[]> {
    const result = await this.prisma.$queryRaw<
      Array<{
        query: string
        calls: bigint
        total_time: number
        mean_time: number
        max_time: number
      }>
    >`
      SELECT 
        LEFT(query, 200) as query,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time
      FROM pg_stat_statements
      WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `

    return result.map((row) => ({
      query: row.query,
      calls: Number(row.calls),
      totalTime: `${row.total_time.toFixed(2)} ms`,
      avgTime: `${row.mean_time.toFixed(2)} ms`,
      maxTime: `${row.max_time.toFixed(2)} ms`,
    }))
  }
}
