import { DriverStatus } from '../driver.entity';
export declare class RegisterDriverDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    status?: DriverStatus;
}
