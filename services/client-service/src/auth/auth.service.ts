import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Client } from '../clients/client.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Client)
    private clientRepo: Repository<Client>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.clientRepo.findOne({ where: { email: dto.email } });
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

    const token = this.jwtService.sign({ sub: client.id, email: client.email });
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

  async login(dto: LoginDto) {
    const client = await this.clientRepo.findOne({ where: { email: dto.email } });
    if (!client) throw new UnauthorizedException('Identifiants invalides');

    const valid = await bcrypt.compare(dto.password, client.password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    const token = this.jwtService.sign({ sub: client.id, email: client.email });
    return {
      token,
      client: {
        id: client.id,
        email: client.email,
        fullName: client.fullName,
      },
    };
  }
}