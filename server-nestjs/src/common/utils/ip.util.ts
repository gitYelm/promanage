import * as geoip from 'geoip-lite'
import type { Request } from 'express'

/**
 * IP 工具类
 */
export class IpUtil {
  /**
   * 获取客户端真实 IP
   */
  static getClientIp(request: Request): string {
    // 优先从 x-forwarded-for 获取(代理/负载均衡场景)
    const forwarded = request.headers['x-forwarded-for']
    if (forwarded) {
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0]
      return ip
    }

    // 从 x-real-ip 获取
    const realIp = request.headers['x-real-ip']
    if (realIp) {
      return typeof realIp === 'string' ? realIp : realIp[0]
    }

    // 从 socket 获取
    const socketIp = request.socket.remoteAddress || ''

    // 处理 IPv6 的 IPv4 映射地址
    if (socketIp.startsWith('::ffff:')) {
      return socketIp.substring(7)
    }

    return socketIp || request.ip || '未知'
  }

  /**
   * 根据 IP 获取地理位置
   */
  static getLocation(ip: string): string {
    // 本地 IP 直接返回
    if (this.isLocalIp(ip)) {
      return '内网IP'
    }

    try {
      const geo = geoip.lookup(ip)
      if (!geo) {
        return '未知'
      }

      // 中国城市映射
      const cityMap: Record<string, string> = {
        // 直辖市
        Beijing: '北京',
        Shanghai: '上海',
        Chongqing: '重庆',
        Tianjin: '天津',
        // 省会城市
        Guangzhou: '广州',
        Shenzhen: '深圳',
        Hangzhou: '杭州',
        Chengdu: '成都',
        Wuhan: '武汉',
        Nanjing: '南京',
        "Xi'an": '西安',
        Xian: '西安',
        Zhengzhou: '郑州',
        Changsha: '长沙',
        Jinan: '济南',
        Shenyang: '沈阳',
        Harbin: '哈尔滨',
        Changchun: '长春',
        Shijiazhuang: '石家庄',
        Taiyuan: '太原',
        Hefei: '合肥',
        Fuzhou: '福州',
        Nanchang: '南昌',
        Kunming: '昆明',
        Guiyang: '贵阳',
        Nanning: '南宁',
        Haikou: '海口',
        Lanzhou: '兰州',
        Yinchuan: '银川',
        Xining: '西宁',
        Hohhot: '呼和浩特',
        Urumqi: '乌鲁木齐',
        Lhasa: '拉萨',
        // 重要城市
        Suzhou: '苏州',
        Wuxi: '无锡',
        Ningbo: '宁波',
        Qingdao: '青岛',
        Dalian: '大连',
        Xiamen: '厦门',
        Dongguan: '东莞',
        Foshan: '佛山',
        Zhuhai: '珠海',
        Zhongshan: '中山',
        Huizhou: '惠州',
        Wenzhou: '温州',
        Changzhou: '常州',
        Nantong: '南通',
        Yangzhou: '扬州',
        Xuzhou: '徐州',
        Yantai: '烟台',
        Weifang: '潍坊',
        Linyi: '临沂',
        Tangshan: '唐山',
        Baoding: '保定',
        Luoyang: '洛阳',
        Zibo: '淄博',
        Quanzhou: '泉州',
        Shaoxing: '绍兴',
        Jiaxing: '嘉兴',
        Taizhou: '台州',
        Jinhua: '金华',
        Huzhou: '湖州',
        Zhenjiang: '镇江',
        Yancheng: '盐城',
        Huaian: '淮安',
        Lianyungang: '连云港',
        Suqian: '宿迁',
      }

      const country = geo.country === 'CN' ? '中国' : geo.country
      const city = geo.city ? cityMap[geo.city] || geo.city : ''
      const region = geo.region || ''

      if (country === '中国') {
        return city ? `${country} ${city}` : `${country} ${region}`
      }

      return city ? `${country} ${city}` : country
    } catch {
      return '未知'
    }
  }

  /**
   * 判断是否为本地 IP
   */
  private static isLocalIp(ip: string): boolean {
    if (!ip || ip === '未知') return true

    return (
      ip === 'localhost' ||
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('172.17.') ||
      ip.startsWith('172.18.') ||
      ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') ||
      ip.startsWith('172.21.') ||
      ip.startsWith('172.22.') ||
      ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') ||
      ip.startsWith('172.25.') ||
      ip.startsWith('172.26.') ||
      ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') ||
      ip.startsWith('172.29.') ||
      ip.startsWith('172.30.') ||
      ip.startsWith('172.31.')
    )
  }
}
