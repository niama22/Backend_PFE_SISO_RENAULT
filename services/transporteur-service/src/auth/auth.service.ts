import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.driverRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already used');

    const hashed = await bcrypt.hash(dto.password, 10);
    const driver = this.driverRepo.create({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone,
    });

    await this.driverRepo.save(driver);

    const token = this.jwtService.sign({ sub: driver.id, email: driver.email });
    return {
      token,
      driver: {
        id: driver.id,
        email: driver.email,
        fullName: driver.fullName,
      },
    };
  }

  async login(dto: LoginDto) {
    const driver = await this.driverRepo.findOne({ where: { email: dto.email } });
    if (!driver) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, driver.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: driver.id, email: driver.email });
    return {
      token,
      driver: {
        id: driver.id,
        email: driver.email,
        fullName: driver.fullName,
      },
    };
  }
}
