import { Injectable, ConflictException, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import { PrismaService } from '../../prisma/prisma.service'
import { ConfigService } from '@nestjs/config';
import { VerifyOTPDto } from './dto/Verify-otp';
import { RegisterDto } from './dto/Register-dto';
import { MailService } from '../mail/mail.service'
import { REDIS_CLIENT } from '../redis/redis.module';
import { LoginDTO } from './dto/Login-dto';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt'
import Redis from 'ioredis';
@Injectable()
export class AuthService {
    constructor (private prisma :  PrismaService,
                 private config : ConfigService,
                 private mailService : MailService,
                 @Inject(REDIS_CLIENT) private readonly redis : Redis
    ){}
    private hashOtp(otp : string | number) : string {
        const secret = this.config.get<string>('OTP_SECRET')
        if (!secret){
            throw new Error('OTP_SECRET is missing');
        }
        return createHmac('sha256', secret).update(String(otp)).digest('hex');
    }
    async register(dto : RegisterDto){
        const email = dto.email.toLowerCase().trim();
        const name = (dto.name ?? dto.fullName ?? '').trim();
        const password = dto.password?.trim();

        if (!name) {
            throw new BadRequestException('Tên không được để trống');
        }
        if (!password) {
            throw new BadRequestException('Mật khẩu không được để trống');
        }
        const exist = await this.prisma.user.findUnique({
            where :{
                email : email
            }
        })
        if (exist) throw new ConflictException('Email đã được sử dụng');
        const passwordHash = await bcrypt.hash(password, 10)
        const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
        const key = `pending:${email}`;
        await this.redis.multi()
              .hset(key, {
                name,
                passwordHash,
                otpHash: this.hashOtp(otp),
                attempts: 0,
              })
              .expire(key, 600)
              .set(`cooldown:${email}`, '1', 'EX', 60)
              .exec()
        await this.mailService.sendOtp(email, otp)
        return { message: 'Mã xác thực đã được gửi tới email của bạn' }; 
    }
    async VerifyOTP(dto : VerifyOTPDto) {
        const email = dto.email.toLowerCase().trim();
        const key = `pending:${email}`
        const pending = await this.redis.hgetall(key);
        if (!pending  || !pending.otpHash){
            throw new BadRequestException('Mã không tồn tại hoặc đã hết hạn');
        } 
        if (Number(pending.attempts) >= 5) {
            await this.redis.del(key);
            throw new BadRequestException('Nhập sai quá số lần cho phép, vui lòng đăng ký lại');
        }
        const a = Buffer.from(this.hashOtp(dto.otp), 'hex');
        const b = Buffer.from(pending.otpHash, 'hex');
        const match = a.length === b.length && timingSafeEqual(a, b);
        if (!match){
            await this.redis.hincrby(key, 'attempts', 1); 
            throw new BadRequestException('Mã không đúng');       
        }
        try {
            const user = await this.prisma.user.create({
                data: {
                    email : email,
                    name: pending.name,
                    passwordHash : pending.passwordHash,
                    isVerified: true,
                },
            });
            await this.redis.del(key);
            return { id: user.id, email: user.email };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') {
                    await this.redis.del(key);
                    throw new ConflictException('Email đã được sử dụng');
                }
            }
            throw e;
        }
    }
    async login(dto : LoginDTO) {
        const email = dto.email.toLowerCase().trim();
        const user = await this.prisma.user.findUnique({
            where : {
                email : email
            }
        })
        if (!user){
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng')
        }
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        return {id: user.id, email}
    }
    async GetProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
            id: true,
            email: true,
            role: true,
            },
        });

        if (!user) throw new UnauthorizedException();
        return user;
    }
}
