import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { RegisterClientDto } from './dto/register-client.dto';
export declare class ClientsService {
    private readonly clientRepository;
    constructor(clientRepository: Repository<Client>);
    register(dto: RegisterClientDto): Promise<Omit<Client, 'password'>>;
    findByEmail(email: string): Promise<Client | null>;
    findById(id: string): Promise<Client>;
    getProfile(id: string): Promise<Omit<Client, 'password'>>;
    updateProfile(id: string, dto: Partial<RegisterClientDto>): Promise<Omit<Client, 'password'>>;
    deactivate(id: string): Promise<{
        message: string;
    }>;
}
