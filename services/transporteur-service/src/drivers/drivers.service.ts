import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(dto: CreateDriverDto): Promise<Driver> {
    const exists = await this.driverRepository.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email déjà utilisé');

    const driver = this.driverRepository.create({
      email: dto.email,
      fullName: dto.fullName,
      phone: dto.phone ?? null,
      isActive: true,
    });

    return this.driverRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return this.driverRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) throw new NotFoundException(`Driver #${id} introuvable`);
    return driver;
  }

  async findByEmail(email: string): Promise<Driver | null> {
    return this.driverRepository.findOne({ where: { email } });
  }

  async update(id: string, dto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findById(id);
    Object.assign(driver, dto);
    return this.driverRepository.save(driver);
  }

  async remove(id: string): Promise<{ message: string }> {
    const driver = await this.findById(id);
    await this.driverRepository.remove(driver);
    return { message: 'Driver supprimé' };
  }
}
