import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklistService } from './token-blacklist.service';

export interface JwtPayload {
  sub: string;       // client UUID
  email: string;
  jti: string;       // JWT ID – required for revocation
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
    // 1. Basic payload shape check
    if (!payload?.sub || !payload?.email || !payload?.jti) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 2. Check if this specific token has been revoked (logged out)
    if (this.blacklist.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token révoqué – veuillez vous reconnecter');
    }

    // req.user will contain this object
    return { id: payload.sub, email: payload.email, jti: payload.jti, exp: payload.exp };
  }
}