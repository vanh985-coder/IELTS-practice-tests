import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { truncateAll } from '../../test/helpers/db';
import { createHash } from 'crypto';
import { TokenService } from './token.service';
describe('AuthService (integration)', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let redis: Redis;
  let mail: { sendOtp: jest.Mock };
  let tokenService! : TokenService
  beforeAll(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    });

    mail = { sendOtp: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        PrismaService,
        TokenService,
        JwtService,
        { provide: MailService, useValue: mail },
        { provide: 'REDIS_CLIENT', useValue: redis },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => process.env[k] },
        },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    tokenService = module.get(TokenService);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    await redis.flushdb();
    jest.clearAllMocks();
  });

  it('luồng đầy đủ: register → lấy OTP thật từ Redis → VerifyOTP → user vào DB', async () => {
    await service.register({
      email: 'vanh@example.com',
      password: 'matkhau123',
      name: 'Van Anh',
    });
    
    const otp = mail.sendOtp.mock.calls[0][1];

    const ttl = await redis.ttl('pending:vanh@example.com');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(600);

    const result = await service.VerifyOTP({
      email: 'vanh@example.com',
      otp,
    });

    const user = await prisma.user.findUnique({
      where: { email: 'vanh@example.com' },
    });
    expect(user).not.toBeNull();
    expect(user!.isVerified).toBe(true);
    expect(result.id).toBe(user!.id);

    expect(await redis.exists('pending:vanh@example.com')).toBe(0);
  });
  it('DB từ chối khi email đã tồn tại (P2002 thật)', async () => {
        await prisma.user.create({
            data: {
            email: 'vanh@example.com',
            name: 'Van Anh',
            passwordHash: 'hash-bat-ky',
            isVerified: true,
            },
        });

        await service.register({
            email: 'vanh@example.com',
            password: 'matkhau123',
            name: 'Van Anh',
        }).catch(() => {});   
        await expect(
            prisma.user.create({
                data: {
                    email: 'vanh@example.com',
                    name: 'Khac',
                    passwordHash: 'hash-khac',
                    isVerified: true,
                },
            }),
        ).rejects.toMatchObject({ code: 'P2002' });
    });
    it('pending có TTL 600 giây', async () => {
        await service.register({ email: 'vanh@example.com', password: 'matkhau123', name: 'Van Anh' });
        const ttl = await redis.ttl('pending:vanh@example.com');
        expect(ttl).toBeGreaterThan(590);
        expect(ttl).toBeLessThanOrEqual(600);
    });
    it('nhập sai OTP không làm mất TTL của pending', async () => {
    await service.register({ email: 'vanh@example.com', password: 'matkhau123', name: 'Van Anh' });

        await service.VerifyOTP({ email: 'vanh@example.com', otp: '000000' }).catch(() => {});

        const ttl = await redis.ttl('pending:vanh@example.com');
        expect(ttl).toBeGreaterThan(0);

        const attempts = await redis.hget('pending:vanh@example.com', 'attempts');
        expect(attempts).toBe('1');
    });
    it('tạo cooldown key với TTL 60 giây', async () => {
        await service.register({ email: 'vanh@example.com', password: 'matkhau123', name: 'Van Anh' });
        const ttl = await redis.ttl('cooldown:vanh@example.com');
        expect(ttl).toBeGreaterThan(50);
        expect(ttl).toBeLessThanOrEqual(60);
    });
    it('lưu hash refresh token vào Redis với TTL 7 ngày', async () => {
        const { refreshToken } = await tokenService.issuePair('user-1', 'vanh@example.com');

        const luuTrongRedis = await redis.get('refresh:user-1');
        const ttl = await redis.ttl('refresh:user-1');

        expect(luuTrongRedis).not.toBe(refreshToken);
        expect(luuTrongRedis).toBe(createHash('sha256').update(refreshToken).digest('hex'));
        expect(ttl).toBeGreaterThan(7 * 24 * 3600 - 10);
    });
});