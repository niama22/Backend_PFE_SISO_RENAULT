import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';
import { RegisterClientDto } from './dto/register-client.dto';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  // ─── Inscription ──────────────────────────────────────────────────────────
  async register(dto: RegisterClientDto): Promise<Omit<Client, 'password'>> {
    const exists = await this.clientRepository.findOne({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email déjà utilisé');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const client = this.clientRepository.create({
      ...dto,
      password: hashed,
    });

    const saved = await this.clientRepository.save(client);
    const result = { ...saved };
    delete result.password;
    return result;
  }

  // ─── Trouver par email (usage Auth) ───────────────────────────────────────
  async findByEmail(email: string): Promise<Client | null> {
    return this.clientRepository.findOne({ where: { email } });
  }

  // ─── Trouver par ID ───────────────────────────────────────────────────────
  async findById(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client #${id} introuvable`);
    }

    return client;
  }

  // ─── Profil (sans password) ───────────────────────────────────────────────
  async getProfile(id: string): Promise<Omit<Client, 'password'>> {
    const client = await this.findById(id);
    const result = { ...client };
    delete result.password;
    return result;
  }

  // ─── Mettre à jour le profil ──────────────────────────────────────────────
  async updateProfile(
    id: string,
    dto: Partial<RegisterClientDto>,
  ): Promise<Omit<Client, 'password'>> {
    const client = await this.findById(id);

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(client, dto);
    const saved = await this.clientRepository.save(client);
    const result = { ...saved };
    delete result.password;
    return result;
  }

  // ─── Désactiver un compte ─────────────────────────────────────────────────
  async deactivate(id: string): Promise<{ message: string }> {
    const client = await this.findById(id);
    client.isActive = false;
    await this.clientRepository.save(client);
    return { message: 'Compte désactivé' };
  }
}
