import { Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { RegisterDriverDto } from './dto/register-driver.dto';
export declare class DriversService {
    private readonly driverRepository;
    constructor(driverRepository: Repository<Driver>);
    register(dto: RegisterDriverDto): Promise<Omit<Driver, 'password'>>;
    findByEmail(email: string): Promise<Driver | null>;
    findById(id: string): Promise<Driver>;
    getProfile(id: string): Promise<Omit<Driver, 'password'>>;
    updateProfile(id: string, dto: Partial<RegisterDriverDto>): Promise<Omit<Driver, 'password'>>;
    deactivate(id: string): Promise<{
        message: string;
    }>;
}
