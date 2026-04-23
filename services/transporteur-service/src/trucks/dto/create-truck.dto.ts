import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTruckDto {
  @IsString()
  matricule: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsUUID()
  driverId: string;

  @IsOptional()
  @IsString()
  order?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
