import { IsOptional, IsString } from 'class-validator';

export class CreateTruckDto {
  @IsString()
  plateNumber!: string;

  @IsString()
  model!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  driverId?: string;
}
