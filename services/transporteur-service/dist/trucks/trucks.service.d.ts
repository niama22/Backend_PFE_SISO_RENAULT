import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { Truck } from './truck.entity';
export declare class TrucksService {
    private readonly truckRepository;
    private readonly driverRepository;
    constructor(truckRepository: Repository<Truck>, driverRepository: Repository<Driver>);
    createTruck(dto: CreateTruckDto): Promise<Truck>;
    getAllTrucks(): Promise<Truck[]>;
    getTruckById(id: string): Promise<Truck>;
}
