import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationEvent, NotificationSeverity } from './notification.types';
import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly maxInMemory = 200;
  private readonly notifications: NotificationEvent[] = [];

  createFromDto(dto: SendNotificationDto): NotificationEvent {
    const severity: NotificationSeverity = dto.severity ?? 'info';
    return {
      id: randomUUID(),
      title: dto.title,
      message: dto.message,
      severity,
      targetUserId: dto.targetUserId,
      missionId: dto.missionId,
      orderId: dto.orderId,
      meta: dto.meta,
      createdAt: new Date().toISOString(),
    };
  }

  add(notification: NotificationEvent) {
    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxInMemory) {
      this.notifications.length = this.maxInMemory;
    }
  }

  list(limit = 50): NotificationEvent[] {
    const l = Math.max(1, Math.min(200, limit));
    return this.notifications.slice(0, l);
  }
}

