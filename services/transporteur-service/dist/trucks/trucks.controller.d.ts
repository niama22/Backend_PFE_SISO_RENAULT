import { CreateTruckDto } from './dto/create-truck.dto';
import { TrucksService } from './trucks.service';
export declare class TrucksController {
    private readonly trucksService;
    constructor(trucksService: TrucksService);
    createTruck(dto: CreateTruckDto): Promise<import("./truck.entity").Truck>;
    getAllTrucks(): Promise<import("./truck.entity").Truck[]>;
    getTruckById(id: string): Promise<import("./truck.entity").Truck>;
}
