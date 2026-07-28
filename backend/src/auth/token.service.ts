import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { REDIS_CLIENT } from "src/redis/redis.module";
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt'
import Redis from "ioredis";
@Injectable()
export class TokenService {
    constructor (private config: ConfigService,
                 private jwt : JwtService,
                 @Inject(REDIS_CLIENT) private readonly redis : Redis
    ) {}
    async issuePair(userId: string, email: string){
        const payload = { sub: userId, email };
        const jti = randomUUID();
        const [accessToken, refreshToken] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: this.config.get('JWT_ACCESS_SECRET'),
                expiresIn: '15m',
            }),
            this.jwt.signAsync(
                { ...payload, jti },  
                { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
            ),
        ]);
        return { accessToken, refreshToken };
    }
    async saveRefreshToken(userId: string, token: string) {
        const hashed = await bcrypt.hash(token, 8);
        await this.redis.set(`refresh:${userId}`, hashed, 'EX', 7 * 24 * 3600);
    }
    async refresh(userId : string, token : string){
        const stored = await this.redis.get(`refresh:${userId}`)
        if (!stored) throw new UnauthorizedException();
        const valid = await bcrypt.compare(token, stored);
        if (!valid) throw new UnauthorizedException();

    }
}