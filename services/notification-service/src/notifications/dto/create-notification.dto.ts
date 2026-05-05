import { IsIn, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  recipient!: string;

  @IsIn(['IN_APP', 'EMAIL'])
  channel!: 'IN_APP' | 'EMAIL';

  @IsString()
  title!: string;

  @IsString()
  message!: string;
}
