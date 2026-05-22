import { Injectable, type MessageEvent } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Subject, Observable, merge, interval, map, filter } from 'rxjs'
import { BusinessException } from '../../common/exceptions/business.exception'
import type { NotificationStreamChannel, NotificationStreamEvent } from './types/notification.types'

interface StreamTokenPayload {
  sub: string
  username: string
  purpose: 'notification_stream'
  channels: NotificationStreamChannel[]
}

@Injectable()
export class NotificationStreamService {
  private readonly events$ = new Subject<{ userId: string; event: NotificationStreamEvent }>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createStreamToken(
    user: { userId: string; username: string },
    channels: NotificationStreamChannel[] = ['notification'],
  ) {
    return {
      token: this.jwtService.sign(
        { sub: user.userId, username: user.username, purpose: 'notification_stream', channels },
        { expiresIn: '60s' },
      ),
      expiresIn: 60,
    }
  }

  verifyStreamToken(token: string): {
    userId: string
    username: string
    channels: NotificationStreamChannel[]
  } {
    try {
      const payload = this.jwtService.verify<StreamTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super-secret-key',
      })
      if (payload.purpose !== 'notification_stream')
        throw BusinessException.unauthorized('通知连接令牌无效')
      return {
        userId: payload.sub,
        username: payload.username,
        channels: payload.channels ?? ['notification'],
      }
    } catch {
      throw BusinessException.unauthorized('通知连接令牌已过期或无效')
    }
  }

  stream(user: {
    userId: string
    channels: NotificationStreamChannel[]
  }): Observable<MessageEvent> {
    const userEvents$ = this.events$.pipe(
      filter((item) => item.userId === user.userId || item.userId === '*'),
      filter((item) => user.channels.includes(this.eventChannel(item.event.type))),
      map((item) => item.event as MessageEvent),
    )
    const heartbeat$ = interval(25000).pipe(
      map(() => ({ type: 'heartbeat', data: { time: new Date().toISOString() } }) as MessageEvent),
    )
    return merge(userEvents$, heartbeat$)
  }

  push(userId: string | bigint, data: unknown) {
    this.events$.next({ userId: String(userId), event: { type: 'notification', data } })
  }

  pushOnlineChange(data: unknown) {
    this.events$.next({ userId: '*', event: { type: 'online-user-change', data } })
  }

  private eventChannel(type: NotificationStreamEvent['type']): NotificationStreamChannel {
    return type === 'online-user-change' ? 'online' : 'notification'
  }
}
