import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(
    err: unknown,
    user: unknown,
    info: { message?: string } | undefined,
  ) {
    if (err || !user) {
      throw new UnauthorizedException(
        info?.message ?? 'Token manquant ou expiré',
      );
    }
    return user; // → devient req.user dans les controllers
  }
}
