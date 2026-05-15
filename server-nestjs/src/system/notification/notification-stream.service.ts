import { Injectable, type MessageEvent } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Subject, Observable, merge, interval, map, filter } from 'rxjs'
import { BusinessException } from '../../common/exceptions/business.exception'
import type { NotificationStreamEvent } from './types/notification.types'

interface StreamTokenPayload {
  sub: string
  username: string
  purpose: 'notification_stream'
}

@Injectable()
export class NotificationStreamService {
  private readonly events$ = new Subject<{ userId: string; event: NotificationStreamEvent }>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createStreamToken(user: { userId: string; username: string }) {
    return {
      token: this.jwtService.sign(
        { sub: user.userId, username: user.username, purpose: 'notification_stream' },
        { expiresIn: '60s' },
      ),
      expiresIn: 60,
    }
  }

  verifyStreamToken(token: string): { userId: string; username: string } {
    try {
      const payload = this.jwtService.verify<StreamTokenPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'super-secret-key',
      })
      if (payload.purpose !== 'notification_stream') throw BusinessException.unauthorized('通知连接令牌无效')
      return { userId: payload.sub, username: payload.username }
    } catch {
      throw BusinessException.unauthorized('通知连接令牌已过期或无效')
    }
  }

  stream(userId: string): Observable<MessageEvent> {
    const userEvents$ = this.events$.pipe(
      filter((item) => item.userId === userId),
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
}
