import { Controller, Post, Body, Req, Res, HttpCode, HttpStatus, UseGuards} from '@nestjs/common';
import type { Request, Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register-dto';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { VerifyOTPDto } from './dto/Verify-otp';
import { LoginDTO } from './dto/Login-dto';
const REFRESH_COOKIE = 'refresh_token';
const REFRESH_PATH = '/auth/refresh';
@Controller('auth')

export class AuthController {
    constructor (private authService : AuthService,
                 private tokenService : TokenService,
                 private config : ConfigService
    ){}
    @Post('register')
    async Register(@Body() dto : RegisterDto){
        return this.authService.register(dto)
    }
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async VerifyOTP(@Body() dto : VerifyOTPDto) {
        return this.authService.VerifyOTP(dto)
    }
    @Post('login')
    @HttpCode(HttpStatus.OK) 
    async Login(@Body() dto : LoginDTO, @Res({ passthrough: true }) res: Response){
        const user = await this.authService.login(dto)
        return this.issueSession(user, res)
    }
    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { userId, email } = req.user as { userId: string; email: string };
        const presented = req.cookies[REFRESH_COOKIE];

        const tokens = await this.tokenService.rotate(userId, email, presented);

        res.cookie(REFRESH_COOKIE, tokens.refreshToken, this.cookieOptions());
        return { accessToken: tokens.accessToken };
    }
    private async issueSession(user: { id: string; email: string }, res: Response) {
        const { accessToken, refreshToken } = await this.tokenService.issuePair(user.id, user.email);
        res.cookie(REFRESH_COOKIE, refreshToken, this.cookieOptions());
        return { accessToken, user: { id: user.id, email: user.email } };  
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const { userId } = req.user as { userId: string };
        await this.tokenService.revoke(userId);
        res.clearCookie(REFRESH_COOKIE, { path: REFRESH_PATH });
    }
    private cookieOptions(): CookieOptions {
        return {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: REFRESH_PATH,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        };
    }
}
