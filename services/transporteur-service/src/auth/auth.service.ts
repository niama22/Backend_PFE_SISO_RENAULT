import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DriversService } from '../drivers/drivers.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly driversService: DriversService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Simple login by email:
   * - If the driver exists, issue a JWT.
   * - If not, create a minimal driver profile and issue a JWT.
   */
  async login(dto: LoginDto) {
    let driver = await this.driversService.findByEmail(dto.email);

    if (!driver) {
      driver = await this.driversService.create({
        email: dto.email,
        fullName: dto.email.split('@')[0] || 'Driver',
      });
    }

    const token = this.jwtService.sign({
      sub: driver.id,
      email: driver.email,
    });

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
