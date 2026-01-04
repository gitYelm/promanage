/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期时间
 * @param dateString 日期字符串
 * @param format 格式化模板,默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!dateString) return '-'

  const date = new Date(dateString)

  // 检查日期是否有效
  if (isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期(不含时间)
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDateOnly(dateString: string | undefined): string {
  return formatDate(dateString, 'YYYY-MM-DD')
}

/**
 * 格式化时间(不含日期)
 * @param dateString 日期字符串
 * @returns 格式化后的时间字符串 HH:mm:ss
 */
export function formatTimeOnly(dateString: string | undefined): string {
  return formatDate(dateString, 'HH:mm:ss')
}

/**
 * 相对时间格式化(如:刚刚、5分钟前、2小时前等)
 * @param dateString 日期字符串
 * @returns 相对时间描述
 */
export function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'

  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  if (months < 12) return `${months}个月前`
  return `${years}年前`
}


/**
 * 解析 Cron 表达式为人类可读的中文说明
 * 支持 6 位格式: 秒 分 时 日 月 周
 * @param cron Cron 表达式
 * @returns 人类可读的说明
 */
export function formatCronExpression(cron: string | undefined): string {
  if (!cron) return ''

  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) return ''

  // 标准化为 6 位 (秒 分 时 日 月 周)
  let s: string, m: string, h: string, d: string, mo: string, w: string
  if (parts.length === 5) {
    ;[m, h, d, mo, w] = parts as [string, string, string, string, string]
    s = '0'
  } else {
    ;[s, m, h, d, mo, w] = parts as [string, string, string, string, string, string]
  }

  // 优先匹配常见模式，返回简洁描述
  // 每 N 秒
  if (s.includes('/')) return `每 ${s.split('/')[1]} 秒执行`
  if (s === '*') return '每秒执行'

  // 每 N 分钟
  if (m.includes('/')) return `每 ${m.split('/')[1]} 分钟执行`
  if (m === '*' && h === '*') return '每分钟执行'

  // 每 N 小时
  if (h.includes('/')) return `每 ${h.split('/')[1]} 小时执行`
  if (h === '*' && m === '0') return '每小时执行'

  // 每天固定时间
  if (h !== '*' && m !== '*' && d === '*' && w === '?') {
    return `每天 ${h.padStart(2, '0')}:${m.padStart(2, '0')} 执行`
  }

  // 每周固定时间
  if (w !== '?' && w !== '*') {
    const weekMap: Record<string, string> = {
      MON: '周一', TUE: '周二', WED: '周三', THU: '周四',
      FRI: '周五', SAT: '周六', SUN: '周日',
      '1': '周日', '2': '周一', '3': '周二', '4': '周三',
      '5': '周四', '6': '周五', '7': '周六',
    }
    const dayName = weekMap[w.toUpperCase()] || w
    if (h !== '*' && m !== '*') {
      return `每${dayName} ${h.padStart(2, '0')}:${m.padStart(2, '0')} 执行`
    }
    return `每${dayName}执行`
  }

  // 每月固定日期
  if (d !== '*' && d !== '?') {
    if (h !== '*' && m !== '*') {
      return `每月 ${d} 日 ${h.padStart(2, '0')}:${m.padStart(2, '0')} 执行`
    }
    return `每月 ${d} 日执行`
  }

  return ''
}
