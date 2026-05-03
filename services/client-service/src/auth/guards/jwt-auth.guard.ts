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

  handleRequest<TUser>(
    err: unknown,
    user: unknown,
    info: unknown,
    _context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    void _context;
    void _status;
    if (err || !user) {
      const message =
        info &&
        typeof info === 'object' &&
        'message' in info &&
        typeof (info as { message?: unknown }).message === 'string'
          ? (info as { message: string }).message
          : 'Token manquant ou expiré';
      throw new UnauthorizedException(message);
    }
    return user as TUser;
  }
}
