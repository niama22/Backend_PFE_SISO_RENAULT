import { IsOptional, IsString } from 'class-validator';

export class ImportOrderDto {
  /**
   * Optional delivery address to apply to the imported order.
   * If not provided, the parser will attempt to read it from the file.
   */
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryCity?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
