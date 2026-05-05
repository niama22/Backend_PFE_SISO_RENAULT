import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      recipient: dto.recipient,
      channel: dto.channel,
      title: dto.title,
      message: dto.message,
      read: false,
    });
    return this.notificationRepo.save(notification);
  }

  async findAll(recipient?: string): Promise<Notification[]> {
    if (recipient) {
      return this.notificationRepo.find({
        where: { recipient },
        order: { createdAt: 'DESC' },
      });
    }
    return this.notificationRepo.find({ order: { createdAt: 'DESC' } });
  }

  async markRead(id: string, read: boolean): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification)
      throw new NotFoundException(`Notification #${id} introuvable`);
    notification.read = read;
    return this.notificationRepo.save(notification);
  }
}
