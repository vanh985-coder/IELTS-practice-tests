import { Inject, Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { REDIS_CLIENT } from "src/redis/redis.module";
import { randomUUID, createHash, timingSafeEqual } from 'crypto';
import Redis from "ioredis";
@Injectable()
export class TokenService {
    constructor (private config: ConfigService,
                 private jwt : JwtService,
                 @Inject(REDIS_CLIENT) private readonly redis : Redis
    ) {}
    private async createAccessToken(userId: string, email: string){
        const payload = {sub : userId, email };
        const accessToken =  this.jwt.sign(payload, {
            secret: this.config.get<string>('JWT_ACCESS_SECRET'),
            expiresIn: '15m',
        })
        return accessToken
    }
    private async createRefreshToken(userId: string, email: string){
        const jti = randomUUID();
        const payload = {sub : userId, email, jti };
        const refreshToken =  this.jwt.sign(payload, {
            secret : this.config.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        })
        const old = await this.redis.get(`refresh:${userId}`);
        const pipeline = this.redis.pipeline();
        if (old) pipeline.set(`refresh:grace:${userId}`, old, 'EX', 30);
        pipeline.set(
            `refresh:${userId}`,
             createHash('sha256').update(refreshToken).digest('hex'),
            'EX', 7 * 24 * 3600,
        );
        await pipeline.exec();
        return refreshToken
    }
    private async verifyRefreshToken(userId : string, presented : string){
        const current = await this.redis.get(`refresh:${userId}`)
        if (!current) {
            throw new UnauthorizedException("Refresh token not found");
        }
        const hashBuf = Buffer.from(
            createHash("sha256").update(presented).digest("hex"),
            "hex",
        );
        const matches = (stored: string | null) => {
            if (!stored) return false;
            const storedBuf = Buffer.from(stored, 'hex');
            return storedBuf.length === hashBuf.length && timingSafeEqual(storedBuf, hashBuf);
        };
        if (matches(await this.redis.get(`refresh:${userId}`))) return true;

        if (matches(await this.redis.get(`refresh:grace:${userId}`))) {
            throw new ConflictException('Đang refresh, thử lại sau');   
        }
        await this.redis.del(`refresh:${userId}`, `refresh:grace:${userId}`);
        throw new UnauthorizedException('Phiên không hợp lệ');
    }
    async issuePair(userId: string, email: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.createAccessToken(userId, email),
            this.createRefreshToken(userId, email),
        ]);
        return { accessToken, refreshToken };
    }
    async rotate(userId: string, email: string, presented : string){
        await this.verifyRefreshToken(userId, presented);
        return this.issuePair(userId, email);  
    }
    async revoke(userId){
        await this.redis.del(`refresh:${userId}`, `refresh:grace:${userId}`);
    }
}