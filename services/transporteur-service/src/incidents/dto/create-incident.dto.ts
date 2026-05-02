import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { IncidentType } from '../enums/incident-type.enum';

export class CreateIncidentDto {
  @IsEnum(IncidentType)
  type!: IncidentType;

  @IsString()
  @MinLength(10, { message: 'Description trop courte (min 10 caractères)' })
  description!: string;

  @IsOptional()
  @IsString()
  truckId?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
