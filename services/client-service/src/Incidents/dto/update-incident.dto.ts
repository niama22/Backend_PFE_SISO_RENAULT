// dto/update-incident.dto.ts
import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  MinLength,
  IsUrl,
} from 'class-validator';
import { IncidentType }   from '../enums/incident-type.enum';
import { IncidentStatus } from '../enums/incident-status.enum';

export class UpdateIncidentDto {

  // ✅ Client peut modifier le type si encore PENDING
  @IsOptional()
  @IsEnum(IncidentType)
  type?: IncidentType;

  // ✅ Client peut modifier la description si encore PENDING
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Description trop courte (min 10 caractères)' })
  description?: string;

  // ✅ Client peut ajouter/modifier des pièces jointes
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Chaque pièce jointe doit être une URL valide' })
  attachments?: string[];

  // ✅ Client peut modifier orderId si PENDING
  @IsOptional()
  @IsString()
  orderId?: string;

  // ✅ Client peut modifier deliveryId si PENDING
  @IsOptional()
  @IsString()
  deliveryId?: string;

  // 🔒 ADMIN SEULEMENT — statut de traitement
  @IsOptional()
  @IsEnum(IncidentStatus)
  status?: IncidentStatus;

  // 🔒 ADMIN SEULEMENT — note de résolution
  @IsOptional()
  @IsString()
  adminNote?: string;
}