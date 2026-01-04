import request from '@/utils/request'
export interface ServerInfo {
  cpu: {
    cpuNum: number
    total: number
    sys: number
    used: number
    wait: number
    free: number
  }
  mem: {
    total: number
    used: number
    free: number
    usage: number
  }
  jvm: {
    total: number
    max: number
    free: number
    version: string
    home: string
    name: string
    startTime: string
    runTime: string
    usage: number
  }
  sys: {
    computerName: string
    computerIp: string
    userDir: string
    osName: string
    osArch: string
  }
  sysFiles: {
    dirName: string
    sysTypeName: string
    typeName: string
    total: string
    free: string
    used: string
    usage: number
  }[]
}

export function getServer() {
  return request<{ data: ServerInfo }>({
    url: '/monitor/server',
    method: 'get',
  }).then((res: any) => res.data)
}
