import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from '../clients/client.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<number>('JWT_EXPIRATION', 86400), // 24h par défaut
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    TokenBlacklistService,  // ← gère sa propre connexion Redis via ioredis
  ],
  controllers: [AuthController],
  exports: [JwtAuthGuard, TokenBlacklistService],
})
export class AuthModule {}