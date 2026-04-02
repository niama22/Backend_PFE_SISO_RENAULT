import { Injectable, Logger } from '@nestjs/common';

/**
 * Stores invalidated JWT JTI (JWT ID) values until their natural expiration.
 *
 * ── Development / single-instance ──────────────────────────────────────────
 *   Uses an in-memory Set. Fast, zero dependencies, but lost on restart and
 *   NOT shared across multiple server instances.
 *
 * ── Production / multi-instance ────────────────────────────────────────────
 *   Replace the Set with a Redis client (ioredis / @nestjs/cache-manager).
 *   Store each jti with a TTL equal to the token's remaining lifetime:
 *
 *   await this.redis.set(`blacklist:${jti}`, '1', 'EX', ttlSeconds);
 *   const isBlocked = await this.redis.exists(`blacklist:${jti}`);
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  // jti  →  timestamp (ms) when the entry expires and can be purged
  private readonly blacklist = new Map<string, number>();

  /**
   * Adds a token's JTI to the blacklist.
   * @param jti   Unique JWT ID (jti claim)
   * @param exp   Token expiration as Unix timestamp (seconds)
   */
  revoke(jti: string, exp: number): void {
    const expiresAtMs = exp * 1000;
    this.blacklist.set(jti, expiresAtMs);
    this.logger.debug(`Token ${jti} revoked, expires at ${new Date(expiresAtMs).toISOString()}`);
    this.purgeExpired();
  }

  /**
   * Returns true if the token has been revoked (is on the blacklist).
   */
  isRevoked(jti: string): boolean {
    const expiresAt = this.blacklist.get(jti);
    if (expiresAt === undefined) return false;

    // Already past natural expiry → clean up and treat as not revoked
    // (the JWT layer would have already rejected it anyway)
    if (Date.now() > expiresAt) {
      this.blacklist.delete(jti);
      return false;
    }

    return true;
  }

  /** Removes entries whose tokens have naturally expired (housekeeping). */
  private purgeExpired(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.blacklist.entries()) {
      if (now > expiresAt) {
        this.blacklist.delete(jti);
      }
    }
  }
}