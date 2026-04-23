import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, logLevel } from 'kafkajs';
import { NotificationsService } from './notifications.service';
import { NotificationEvent } from './notification.types';

@Injectable()
export class KafkaNotificationsGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaNotificationsGateway.name);
  private readonly kafka = new Kafka({
    brokers: [process.env.KAFKA_BROKER || 'kafka:9092'],
    logLevel: logLevel.NOTHING,
  });

  private readonly topicSend =
    process.env.KAFKA_TOPIC_NOTIFICATION_SEND || 'notification.send';

  private readonly producer = this.kafka.producer();
  private readonly consumer = this.kafka.consumer({
    groupId: process.env.KAFKA_CONSUMER_GROUP || 'notification-service',
  });

  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit() {
    await this.producer.connect();
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.topicSend, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        try {
          const parsed = JSON.parse(message.value.toString()) as NotificationEvent;
          if (!parsed?.id || !parsed?.title || !parsed?.message) return;
          this.notificationsService.add(parsed);
        } catch (e) {
          this.logger.warn(`Invalid notification payload: ${String(e)}`);
        }
      },
    });

    this.logger.log(`Kafka connected. Consuming topic: ${this.topicSend}`);
  }

  async onModuleDestroy() {
    await Promise.allSettled([this.consumer.disconnect(), this.producer.disconnect()]);
  }

  async publish(notification: NotificationEvent) {
    await this.producer.send({
      topic: this.topicSend,
      messages: [
        {
          key: notification.targetUserId || notification.missionId || notification.orderId,
          value: JSON.stringify(notification),
        },
      ],
    });
  }
}

