import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';
import { KafkaNotificationsGateway } from './kafka-notifications.gateway';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly kafkaGateway: KafkaNotificationsGateway,
  ) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  // Publishes to Kafka: notification.send
  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    const notification = this.notificationsService.createFromDto(dto);
    await this.kafkaGateway.publish(notification);
    return { id: notification.id };
  }

  // Returns recent notifications received (in-memory buffer).
  @Get()
  list(@Query('limit') limit?: string) {
    const l = limit ? Number(limit) : 50;
    return this.notificationsService.list(Number.isFinite(l) ? l : 50);
  }
}

