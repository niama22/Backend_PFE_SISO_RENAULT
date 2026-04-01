import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Client } from '../clients/client.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private clientRepo;
    private jwtService;
    constructor(clientRepo: Repository<Client>, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        token: string;
        client: {
            id: string;
            email: string;
            fullName: string;
            city: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        client: {
            id: string;
            email: string;
            fullName: string;
        };
    }>;
}
