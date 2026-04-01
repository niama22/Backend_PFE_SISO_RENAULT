import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
