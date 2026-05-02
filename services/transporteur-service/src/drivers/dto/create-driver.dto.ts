import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateDriverDto {
  @IsEmail()
  email!: string;

  @IsString()
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
