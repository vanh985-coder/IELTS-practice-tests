import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { PrimaModule } from 'prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from './guards/jwt-access.strategy';
import { JwtRefreshStrategy } from './guards/jwt-refresh.strategy';
@Module({
  imports : [PrimaModule,
             JwtModule.register({}),
             PassportModule
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtAccessStrategy, JwtRefreshStrategy]
})
export class AuthModule {}
