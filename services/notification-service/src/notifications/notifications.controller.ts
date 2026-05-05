import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Query('recipient') recipient?: string) {
    return this.notificationsService.findAll(recipient);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(id, dto.read);
  }
}
