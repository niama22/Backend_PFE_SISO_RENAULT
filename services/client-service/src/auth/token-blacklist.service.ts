import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Stocke les JTI révoqués dans Redis avec un TTL automatique.
 * Quand le TTL expire, Redis supprime l'entrée tout seul → zéro maintenance.
 *
 * Clé Redis : blacklist:<jti>
 * Valeur    : "1"  (la valeur n'importe pas, seule la présence compte)
 * TTL       : durée restante du token (exp - now) en secondes
 */
@Injectable()
export class TokenBlacklistService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redis!: Redis;

  constructor(private readonly config: ConfigService) {}

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onModuleInit() {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'redis'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });

    this.redis.on('connect', () =>
      this.logger.log('✅ TokenBlacklistService connecté à Redis'),
    );
    this.redis.on('error', (err) =>
      this.logger.error('❌ Erreur Redis blacklist:', err.message),
    );
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  /**
   * Révoque un token : stocke son JTI dans Redis avec un TTL = durée restante.
   * L'entrée disparaît automatiquement quand le token aurait expiré de toute façon.
   *
   * @param jti  Identifiant unique du token (claim `jti`)
   * @param exp  Expiration Unix timestamp en secondes (claim `exp`)
   */
  async revoke(jti: string, exp: number): Promise<void> {
    const ttlSeconds = exp - Math.floor(Date.now() / 1000);

    if (ttlSeconds <= 0) {
      this.logger.debug(
        `Token ${jti} déjà expiré naturellement, skip blacklist`,
      );
      return;
    }

    await this.redis.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
    this.logger.debug(`Token ${jti} révoqué, TTL=${ttlSeconds}s`);
  }

  /**
   * @returns true si le JTI est dans la blacklist Redis
   */
  async isRevoked(jti: string): Promise<boolean> {
    const exists = await this.redis.exists(`blacklist:${jti}`);
    return exists === 1;
  }
}
