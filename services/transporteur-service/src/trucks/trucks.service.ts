import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { Truck } from './truck.entity';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async createTruck(dto: CreateTruckDto): Promise<Truck> {
    const exists = await this.truckRepository.findOne({
      where: { matricule: dto.matricule },
    });
    if (exists) throw new ConflictException('Matricule already used');

    const driver = await this.driverRepository.findOne({
      where: { id: dto.driverId },
    });
    if (!driver) throw new NotFoundException(`Driver #${dto.driverId} not found`);

    const truck = this.truckRepository.create({
      matricule: dto.matricule,
      capacity: dto.capacity,
      order: dto.order,
      location: dto.location,
      driver,
    });

    return this.truckRepository.save(truck);
  }

  async getAllTrucks(): Promise<Truck[]> {
    return this.truckRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getTruckById(id: string): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id } });
    if (!truck) throw new NotFoundException(`Truck #${id} not found`);
    return truck;
  }
}
