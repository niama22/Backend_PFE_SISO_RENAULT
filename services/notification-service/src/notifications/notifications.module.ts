import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { KafkaNotificationsGateway } from './kafka-notifications.gateway';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, KafkaNotificationsGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}

