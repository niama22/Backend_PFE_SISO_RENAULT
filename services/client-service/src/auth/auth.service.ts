import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
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
  /**
   * Revokes the token by adding its JTI to the blacklist.
   * After this call the token will be rejected by JwtStrategy even if it
   * hasn't expired yet.
   *
   * @param jti  Token's unique ID (from req.user.jti injected by JwtStrategy)
   * @param exp  Token's expiration as Unix timestamp (from req.user.exp)
   */
  logout(jti: string, exp: number): { message: string } {
    this.blacklist.revoke(jti, exp);
    return { message: 'Déconnexion réussie' };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  /**
   * Signs a JWT with a unique JTI so it can be individually revoked.
   * Adjust `expiresIn` to taste (e.g. '15m' + refresh tokens for stricter setups).
   */
  private signToken(clientId: string, email: string): string {
    return this.jwtService.sign(
      { sub: clientId, email, jti: randomUUID() },
      { expiresIn: '7d' },   // ← change to '15m' for short-lived tokens
    );
  }
}