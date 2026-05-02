import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
  ) {}

  async create(dto: CreateTruckDto): Promise<Truck> {
    const exists = await this.truckRepository.findOne({
      where: { plateNumber: dto.plateNumber },
    });
    if (exists) throw new ConflictException('Plate number déjà utilisé');

    const truck = this.truckRepository.create({
      plateNumber: dto.plateNumber,
      model: dto.model,
      status: dto.status ?? null,
      driverId: dto.driverId ?? null,
    });

    return this.truckRepository.save(truck);
  }

  async findAll(): Promise<Truck[]> {
    return this.truckRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Truck> {
    const truck = await this.truckRepository.findOne({ where: { id } });
    if (!truck) throw new NotFoundException(`Truck #${id} introuvable`);
    return truck;
  }

  async update(id: string, dto: UpdateTruckDto): Promise<Truck> {
    const truck = await this.findById(id);
    Object.assign(truck, dto);
    return this.truckRepository.save(truck);
  }

  async remove(id: string): Promise<{ message: string }> {
    const truck = await this.findById(id);
    await this.truckRepository.remove(truck);
    return { message: 'Truck supprimé' };
  }
}
