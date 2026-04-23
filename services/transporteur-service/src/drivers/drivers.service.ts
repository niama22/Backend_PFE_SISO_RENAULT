import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { RegisterDriverDto } from './dto/register-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async register(dto: RegisterDriverDto): Promise<Omit<Driver, 'password'>> {
    const exists = await this.driverRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already used');

    const hashed = await bcrypt.hash(dto.password, 10);
    const driver = this.driverRepository.create({
      ...dto,
      password: hashed,
    });

    const saved = await this.driverRepository.save(driver);
    const { password, ...result } = saved;
    return result;
  }

  async findByEmail(email: string): Promise<Driver | null> {
    return this.driverRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} not found`);
    return driver;
  }

  async getProfile(id: string): Promise<Omit<Driver, 'password'>> {
    const driver = await this.findById(id);
    const { password, ...result } = driver;
    return result;
  }

  async updateProfile(
    id: string,
    dto: Partial<RegisterDriverDto>,
  ): Promise<Omit<Driver, 'password'>> {
    const driver = await this.findById(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(driver, dto);
    const saved = await this.driverRepository.save(driver);
    const { password, ...result } = saved;
    return result;
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const driver = await this.findById(id);
    driver.isActive = false;
    await this.driverRepository.save(driver);
    return { message: 'Driver deactivated' };
  }
}
