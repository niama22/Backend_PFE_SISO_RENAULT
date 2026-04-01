import { ClientsService } from './clients.service';
import { RegisterClientDto } from './dto/register-client.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
    register(dto: RegisterClientDto): Promise<Omit<import("./client.entity").Client, "password">>;
    getProfile(req: any): Promise<Omit<import("./client.entity").Client, "password">>;
    updateProfile(dto: Partial<RegisterClientDto>, req: any): Promise<Omit<import("./client.entity").Client, "password">>;
    deactivate(req: any): Promise<{
        message: string;
    }>;
}
