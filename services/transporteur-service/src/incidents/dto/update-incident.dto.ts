import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IncidentStatus } from '../enums/incident-status.enum';
import { IncidentType } from '../enums/incident-type.enum';

export class UpdateIncidentDto {
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Description trop courte (min 10 caractères)' })
  description?: string;

  @IsOptional()
  @IsString()
  truckId?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}
