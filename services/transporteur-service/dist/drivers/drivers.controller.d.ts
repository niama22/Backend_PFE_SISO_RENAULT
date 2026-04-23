import { DriversService } from './drivers.service';
import { RegisterDriverDto } from './dto/register-driver.dto';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    register(dto: RegisterDriverDto): Promise<Omit<import("./driver.entity").Driver, "password">>;
    getProfile(req: any): Promise<Omit<import("./driver.entity").Driver, "password">>;
    updateProfile(dto: Partial<RegisterDriverDto>, req: any): Promise<Omit<import("./driver.entity").Driver, "password">>;
    deactivate(req: any): Promise<{
        message: string;
    }>;
}
