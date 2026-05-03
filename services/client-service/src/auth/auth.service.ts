import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Client } from '../clients/client.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private jwtService: JwtService,
    private blacklist: TokenBlacklistService,
    private configService: ConfigService,
  ) {}

  // ─── REGISTER ─────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const exists = await this.clientRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);
    const client = this.clientRepo.create({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      phone: dto.phone,
      address: dto.address,
      ...(dto.city !== undefined && { city: dto.city }),
    });

    await this.clientRepo.save(client);

    const token = this.signToken(client.id, client.email);
    return {
      token,
      client: {
        id: client.id,
        email: client.email,
        fullName: client.fullName,
        city: client.city ?? undefined,
      },
    };
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const client = await this.clientRepo.findOne({
      where: { email: dto.email },
    });
    if (!client) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, client.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    const token = this.signToken(client.id, client.email);
    return {
      token,
      client: {
        id: client.id,
        email: client.email,
        fullName: client.fullName,
      },
    };
  }

  // ─── LOGOUT ───────────────────────────────────────────────────────────────
  async logout(jti: string, exp: number): Promise<{ message: string }> {
    await this.blacklist.revoke(jti, exp);
    return { message: 'Déconnexion réussie' };
  }

  // ─── HELPER ───────────────────────────────────────────────────────────────
  private signToken(clientId: string, email: string): string {
    const expiresIn = this.configService.get<number>('JWT_EXPIRATION', 86400);
    return this.jwtService.sign(
      { sub: clientId, email, jti: randomUUID() },
      { expiresIn },
    );
  }
}
