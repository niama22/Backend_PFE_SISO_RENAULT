import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsIn(['info', 'warning', 'critical'])
  severity?: 'info' | 'warning' | 'critical';

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  missionId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}

