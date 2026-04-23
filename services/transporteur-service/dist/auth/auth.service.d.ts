import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/driver.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly driverRepo;
    private readonly jwtService;
    constructor(driverRepo: Repository<Driver>, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        token: string;
        driver: {
            id: string;
            email: string;
            fullName: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        driver: {
            id: string;
            email: string;
            fullName: string;
        };
    }>;
}
