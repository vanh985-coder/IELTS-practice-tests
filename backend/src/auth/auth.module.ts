import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PrimaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from './guards/jwt-access.strategy';
import { JwtRefreshStrategy } from './guards/jwt-refresh.strategy';
import { MailModule } from '../mail/mail.module'
import { RolesGuard } from './guards/roles.guard';
@Module({
  imports: [PrimaModule, JwtModule.register({}), PassportModule, MailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    RolesGuard,
  ],
  exports: [JwtAccessStrategy, JwtRefreshStrategy, RolesGuard],
})
export class AuthModule {}
