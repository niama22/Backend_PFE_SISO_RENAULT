import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── POST /auth/register ──────────────────────────────────────────────────
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── POST /auth/login ─────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ─── POST /auth/logout ────────────────────────────────────────────────────
  /**
   * Requires a valid JWT (Authorization: Bearer <token>).
   * Adds the token's JTI to the blacklist so it is rejected on future requests
   * even before its natural expiration.
   *
   * The client should also delete the token from storage (localStorage / cookie).
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(@Request() req) {
    // req.user is populated by JwtStrategy.validate()
    // It contains { id, email, jti, exp }
    return this.authService.logout(req.user.jti, req.user.exp);
  }
}