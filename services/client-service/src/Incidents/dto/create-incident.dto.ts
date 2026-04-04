// dto/create-incident.dto.ts
import { IsEnum, IsString, IsOptional, MinLength, IsArray } from 'class-validator';
import { IncidentType } from '../enums/incident-type.enum';

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type!: IncidentType;

  @IsString()
  @MinLength(10, { message: 'Description trop courte (min 10 caractères)' })
  description!: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];     // URLs des images uploadées
}