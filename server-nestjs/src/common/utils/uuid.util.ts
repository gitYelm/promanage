import { randomUUID } from 'crypto'

/**
 * 生成 UUID v4
 * 使用 Node.js 内置的 crypto.randomUUID()，比自定义实现更安全
 */
export function generateUuid(): string {
  return randomUUID()
}
