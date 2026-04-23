import { Driver } from '../drivers/driver.entity';
export declare class Truck {
    id: string;
    matricule: string;
    capacity: number;
    order: string;
    location: string;
    driver: Driver;
    createdAt: Date;
    updatedAt: Date;
}
