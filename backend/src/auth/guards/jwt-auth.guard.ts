
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Access token đã hết hạn',
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        code: 'TOKEN_INVALID',
        message: 'Token không hợp lệ',
      });
    }
    return user;  
  }
}