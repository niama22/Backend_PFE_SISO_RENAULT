import { Truck } from '../trucks/truck.entity';
export declare enum DriverStatus {
    AVAILABLE = "available",
    BUSY = "busy",
    OFFLINE = "offline"
}
export declare class Driver {
    id: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    isActive: boolean;
    status: DriverStatus;
    trucks: Truck[];
    createdAt: Date;
    updatedAt: Date;
}
