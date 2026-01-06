import { Injectable } from '@nestjs/common'
import os from 'os'
import { execSync } from 'child_process'

@Injectable()
export class ServerService {
  private lastCpuInfo: { idle: number; total: number } | null = null
  private processStartTime = Date.now()

  getInfo() {
    // 内存信息 (转换为 GB)
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsage = totalMem ? +((usedMem / totalMem) * 100).toFixed(2) : 0

    // CPU 使用率计算
    const cpuInfo = this.getCpuUsage()

    // Node.js 进程内存
    const memoryUsage = process.memoryUsage()
    const heapTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const heapUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const heapFree = heapTotal - heapUsed

    // 运行时长格式化
    const uptimeSeconds = Math.round(process.uptime())
    const runTime = this.formatUptime(uptimeSeconds)

    // 启动时间
    const startTime = new Date(this.processStartTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const jvm = {
      total: heapTotal,
      max: Math.round(memoryUsage.rss / 1024 / 1024),
      free: heapFree,
      version: process.version,
      home: process.execPath,
      name: 'Node.js',
      startTime,
      runTime,
      usage: heapTotal ? Math.round((heapUsed / heapTotal) * 100) : 0,
    }

    // 获取服务器 IP
    const computerIp = this.getLocalIp()

    // 获取磁盘信息
    const sysFiles = this.getDiskInfo()

    return {
      cpu: {
        cpuNum: os.cpus().length,
        total: 100,
        sys: cpuInfo.sys,
        used: cpuInfo.user,
        wait: cpuInfo.wait,
        free: cpuInfo.free,
      },
      mem: {
        total: +(totalMem / 1024 / 1024 / 1024).toFixed(2),
        used: +(usedMem / 1024 / 1024 / 1024).toFixed(2),
        free: +(freeMem / 1024 / 1024 / 1024).toFixed(2),
        usage: memUsage,
      },
      jvm,
      sys: {
        computerName: os.hostname(),
        computerIp,
        userDir: process.cwd(),
        osName: os.type(),
        osArch: os.arch(),
      },
      sysFiles,
    }
  }

  /**
   * 计算 CPU 使用率
   */
  private getCpuUsage(): {
    user: number
    sys: number
    wait: number
    free: number
  } {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0
    let totalUser = 0
    let totalSys = 0

    for (const cpu of cpus) {
      totalUser += cpu.times.user
      totalSys += cpu.times.sys
      totalIdle += cpu.times.idle
      totalTick += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
    }

    // 如果有上次的数据，计算差值
    if (this.lastCpuInfo) {
      const idleDiff = totalIdle - this.lastCpuInfo.idle
      const totalDiff = totalTick - this.lastCpuInfo.total

      if (totalDiff > 0) {
        const usedPercent = +((1 - idleDiff / totalDiff) * 100).toFixed(2)
        const userPercent = +((totalUser / totalTick) * 100).toFixed(2)
        const sysPercent = +((totalSys / totalTick) * 100).toFixed(2)

        this.lastCpuInfo = { idle: totalIdle, total: totalTick }

        return {
          user: Math.min(userPercent, usedPercent),
          sys: Math.min(sysPercent, usedPercent - userPercent),
          wait: 0,
          free: +(100 - usedPercent).toFixed(2),
        }
      }
    }

    // 首次调用，使用 loadavg 估算
    this.lastCpuInfo = { idle: totalIdle, total: totalTick }
    const load = os.loadavg()[0]
    const cpuCount = cpus.length
    const estimated = cpuCount ? +(Math.min(load / cpuCount, 1) * 100).toFixed(2) : 0

    return {
      user: +(estimated * 0.7).toFixed(2),
      sys: +(estimated * 0.3).toFixed(2),
      wait: 0,
      free: +(100 - estimated).toFixed(2),
    }
  }

  /**
   * 获取本机 IP 地址
   */
  private getLocalIp(): string {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      const netInterface = interfaces[name]
      if (!netInterface) continue
      for (const net of netInterface) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
    return '127.0.0.1'
  }

  /**
   * 格式化运行时长
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts: string[] = []
    if (days > 0) parts.push(`${days}天`)
    if (hours > 0) parts.push(`${hours}小时`)
    if (minutes > 0) parts.push(`${minutes}分钟`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

    return parts.join('')
  }

  /**
   * 获取磁盘信息
   * 只返回系统主要磁盘分区，过滤临时卷和虚拟文件系统
   */
  private getDiskInfo(): Array<{
    dirName: string
    sysTypeName: string
    typeName: string
    total: string
    free: string
    used: string
    usage: number
  }> {
    try {
      const platform = os.platform()

      if (platform === 'darwin') {
        // macOS: 使用 diskutil 获取准确的 APFS 容器信息
        return this.getMacOSDiskInfo()
      } else if (platform === 'linux') {
        return this.getLinuxDiskInfo()
      } else if (platform === 'win32') {
        // Windows: 使用 wmic 命令
        const output = execSync('wmic logicaldisk get size,freespace,caption', {
          encoding: 'utf-8',
        })
        const lines = output.trim().split('\n').slice(1)
        const disks: Array<{
          dirName: string
          sysTypeName: string
          typeName: string
          total: string
          free: string
          used: string
          usage: number
        }> = []

        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length < 3) continue

          const caption = parts[0]
          const freeSpace = parseInt(parts[1], 10)
          const size = parseInt(parts[2], 10)

          if (isNaN(size) || size === 0) continue

          const used = size - freeSpace
          disks.push({
            dirName: caption,
            sysTypeName: 'Local Disk',
            typeName: 'NTFS',
            total: this.formatBytes(size),
            free: this.formatBytes(freeSpace),
            used: this.formatBytes(used),
            usage: +((used / size) * 100).toFixed(2),
          })
        }

        return disks
      }

      return []
    } catch {
      return []
    }
  }

  /**
   * macOS: 使用 diskutil 获取准确的磁盘信息
   */
  private getMacOSDiskInfo(): Array<{
    dirName: string
    sysTypeName: string
    typeName: string
    total: string
    free: string
    used: string
    usage: number
  }> {
    try {
      const output = execSync('diskutil info /', { encoding: 'utf-8' })

      // 解析 Container Total Space 和 Container Free Space
      const totalMatch = output.match(
        /Container Total Space:\s+([\d.]+)\s*(\w+)\s+\((\d+)\s+Bytes\)/,
      )
      const freeMatch = output.match(/Container Free Space:\s+([\d.]+)\s*(\w+)\s+\((\d+)\s+Bytes\)/)

      if (totalMatch && freeMatch) {
        const totalBytes = parseInt(totalMatch[3], 10)
        const freeBytes = parseInt(freeMatch[3], 10)
        const usedBytes = totalBytes - freeBytes
        const usage = +((usedBytes / totalBytes) * 100).toFixed(2)

        return [
          {
            dirName: '系统盘 (Macintosh HD)',
            sysTypeName: 'APFS',
            typeName: 'APFS',
            total: this.formatBytes(totalBytes),
            free: this.formatBytes(freeBytes),
            used: this.formatBytes(usedBytes),
            usage,
          },
        ]
      }

      // 回退到 df 命令
      return this.getDiskInfoByDf('darwin')
    } catch {
      return this.getDiskInfoByDf('darwin')
    }
  }

  /**
   * Linux: 使用 df 获取磁盘信息
   */
  private getLinuxDiskInfo(): Array<{
    dirName: string
    sysTypeName: string
    typeName: string
    total: string
    free: string
    used: string
    usage: number
  }> {
    return this.getDiskInfoByDf('linux')
  }

  /**
   * 通用 df 命令获取磁盘信息
   */
  private getDiskInfoByDf(platform: string): Array<{
    dirName: string
    sysTypeName: string
    typeName: string
    total: string
    free: string
    used: string
    usage: number
  }> {
    try {
      const output = execSync('df -kP /', { encoding: 'utf-8' })
      const lines = output.trim().split('\n')
      if (lines.length < 2) return []

      const parts = lines[1].split(/\s+/)
      const totalKb = parseInt(parts[1], 10)
      const usedKb = parseInt(parts[2], 10)
      const freeKb = parseInt(parts[3], 10)

      if (isNaN(totalKb) || totalKb === 0) return []

      return [
        {
          dirName: platform === 'darwin' ? '系统盘 (Macintosh HD)' : '系统盘 (/)',
          sysTypeName: platform === 'darwin' ? 'APFS' : 'ext4',
          typeName: platform === 'darwin' ? 'APFS' : 'ext4',
          total: this.formatBytes(totalKb * 1024),
          free: this.formatBytes(freeKb * 1024),
          used: this.formatBytes(usedKb * 1024),
          usage: +((usedKb / totalKb) * 100).toFixed(2),
        },
      ]
    } catch {
      return []
    }
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
