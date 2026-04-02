import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly blacklist: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not defined');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.email || !payload?.jti) {
      throw new UnauthorizedException('Payload token invalide');
    }

    // Vérifie dans Redis si ce token a été révoqué (logout)
    const revoked = await this.blacklist.isRevoked(payload.jti);
    if (revoked) {
      throw new UnauthorizedException('Token révoqué – veuillez vous reconnecter');
    }

    return {
      id: payload.sub,
      email: payload.email,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}