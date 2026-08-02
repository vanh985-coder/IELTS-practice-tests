import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from '../mail/mail.service';   
import { BadRequestException, UnauthorizedException, ConflictException  } from '@nestjs/common';
import { createHmac } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const mockedBcrypt = jest.mocked(bcrypt);
jest.mock('bcrypt');
describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let redis: any;
  let mail: any;
  let config: any;
  let multiMock: any;
  const userMau = {
    id: 'user-uuid-1',
    email: 'vanh@example.com',
    passwordHash: '$2b$10$hash-gia',
    isVerified: true,
  };
  beforeEach(async () => {
    mockedBcrypt.hash.mockReset();
    mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
    multiMock = {
      hset: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    prisma = {
      user: { findUnique: jest.fn(),
              create: jest.fn(),
       },
    };
    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      hgetall: jest.fn(),           
      hincrby: jest.fn(),
      multi: jest.fn(() => multiMock),
    };
    mail = {
      sendOtp: jest.fn(),        
    };
    config = {
      get: jest.fn((key: string) =>
        key === 'OTP_SECRET' ? 'secret-test' : undefined,
      ),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
        { provide: MailService, useValue: mail },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe('login', () => {
    it('service được tạo thành công', () => {
      expect(service).toBeDefined();
    });
    it('trả về id và email khi đăng nhập đúng', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prisma.user.findUnique.mockResolvedValue(userMau);
      const result = await service.login({
        email: 'vanh@example.com',
        password: 'matkhau123',
      });
      expect(result).toEqual({ id: 'user-uuid-1', email: 'vanh@example.com' });
    });
    it('chuẩn hoá email (viết thường + bỏ khoảng trắng) trước khi tìm user', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      prisma.user.findUnique.mockResolvedValue(userMau);

      await service.login({
        email: '  VAnh@Example.COM  ',
        password: 'matkhau123',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'vanh@example.com' },
      });
    });
    it('throw UnauthorizedException khi email không tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'khongco@example.com', password: 'matkhau123' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });
    it('throw UnauthorizedException khi mật khẩu sai', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);
      prisma.user.findUnique.mockResolvedValue(userMau);

      await expect(
        service.login({ email: 'vanh@example.com', password: 'sai-roi' }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('không tiết lộ email nào đã tồn tại trong hệ thống', async () => {
      // TH1: email không có
      prisma.user.findUnique.mockResolvedValue(null);
      const loi1 = await service
        .login({ email: 'khongco@example.com', password: 'x' })
        .catch((e) => e.message);

      // TH2: email có, mật khẩu sai
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      prisma.user.findUnique.mockResolvedValue(userMau);
      const loi2 = await service
        .login({ email: 'vanh@example.com', password: 'x' })
        .catch((e) => e.message);

      expect(loi1).toBe(loi2);
    });
  })
  describe('VerifyOTP', () => {
    it('tạo user, xoá key và trả về id/email khi OTP đúng', async() => {
      const otpHash = createHmac('sha256', 'secret-test').update(String(123456)).digest('hex')
      redis.hgetall.mockResolvedValue({
        name: 'Van Anh',
        passwordHash: '$2b$10$hash-gia',
        otpHash,
        attempts: '0',
      });
      prisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'vanh@example.com',
      })
      const result = await service.VerifyOTP({
        email : 'vanh@example.com',
        otp: '123456',
      })
      expect(result).toEqual({
        id : 'user-uuid-1',
        email: 'vanh@example.com'
      })
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
            email : 'vanh@example.com',
            name: 'Van Anh',
            passwordHash : '$2b$10$hash-gia',
            isVerified: true,
        },
      })
      expect(redis.del).toHaveBeenCalledWith('pending:vanh@example.com')
    })
    it('throw khi không có pending (hết hạn hoặc chưa đăng ký)', async () => {
      
      redis.hgetall.mockResolvedValue({})
      await expect(
      service.VerifyOTP({ email: 'vanh@example.com', otp: '123456' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(redis.hincrby).not.toHaveBeenCalled();
    })
    it('tăng attempt và không xóa key khi nhập sai mã', async() => {
      const email = 'vanh@example.com'
      const key = `pending:${email}`
      const otpHash = createHmac('sha256', 'secret-test').update(String(123456)).digest('hex')
      redis.hgetall.mockResolvedValue({
        name: 'Van Anh',
        passwordHash: '$2b$10$hash-gia',
        otpHash,
        attempts: '0',
      })
      await expect(
        service.VerifyOTP({ email: 'vanh@example.com', otp: '123455' }),
      ).rejects.toThrow(BadRequestException)
      expect(redis.hincrby).toHaveBeenCalledWith(key, 'attempts', 1);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    })
    it('vượt quá số lần thử, xóa key khỏi redis', async() => {
      const email = 'vanh@example.com'
      const key = `pending:${email}`
      const otpHash = createHmac('sha256', 'secret-test').update(String(123456)).digest('hex')
      redis.hgetall.mockResolvedValue({
        name: 'Van Anh',
        passwordHash: '$2b$10$hash-gia',
        otpHash,
        attempts: '5',
      })
      await expect(
        service.VerifyOTP({ email: 'vanh@example.com', otp: '123455' }),
      ).rejects.toThrow(BadRequestException)
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(redis.hincrby).not.toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalledWith(key);
    })
    it('throw ConflictException và xoá key khi email đã tồn tại (P2002)', async () => {
      const EMAIL = 'vanh@example.com';
      const KEY = `pending:${EMAIL}`;
      const otpHash = createHmac('sha256', 'secret-test')
        .update('123456')
        .digest('hex');

      redis.hgetall.mockResolvedValue({
        name: 'Van Anh',
        passwordHash: '$2b$10$hash-gia',
        otpHash,
        attempts: '0',
      });

      const loi: any = new Error('Unique constraint failed');
      loi.code = 'P2002';
      Object.setPrototypeOf(loi, Prisma.PrismaClientKnownRequestError.prototype);
      prisma.user.create.mockRejectedValue(loi);

      await expect(
        service.VerifyOTP({ email: EMAIL, otp: '123456' }),
      ).rejects.toThrow(ConflictException);

      expect(redis.del).toHaveBeenCalledWith(KEY);
    });
    it('ném nguyên lỗi và KHÔNG xoá key khi Prisma lỗi khác P2002', async () => {
      const otpHash = createHmac('sha256', 'secret-test')
        .update('123456')
        .digest('hex');

      redis.hgetall.mockResolvedValue({
        name: 'Van Anh',
        passwordHash: '$2b$10$hash-gia',
        otpHash,
        attempts: '0',
      });

      prisma.user.create.mockRejectedValue(new Error('DB sập'));

      await expect(
        service.VerifyOTP({ email: 'vanh@example.com', otp: '123456' }),
      ).rejects.toThrow('DB sập');

      expect(redis.del).not.toHaveBeenCalled();
    });
  })
  describe('Register', () => {
    it('Thiếu name', async () => {
      await expect(
        service.register({
          email: 'vanh@example.com',
          password : '123456',
          name : ''
        })
      ).rejects.toThrow(BadRequestException)
    })
    it('Thiếu password', async () => {
      await expect(
        service.register({
          email: 'vanh@example.com',
          password : '',
          name : 'Van Anh'
        })
      ).rejects.toThrow(BadRequestException)
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(redis.multi).not.toHaveBeenCalled();
      expect(mail.sendOtp).not.toHaveBeenCalled();
    })
    it('Email đã tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue(userMau);
      await expect(
        service.register({
          email: 'vanh@example.com',
          password : '123456',
          name : 'Van Anh'
        })
      ).rejects.toThrow(ConflictException)
      expect(redis.multi).not.toHaveBeenCalled();
      expect(mail.sendOtp).not.toHaveBeenCalled();
    })
    it('tạo pending, gửi OTP và trả về message khi hợp lệ', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      const result = await service.register({
        email: 'vanh@example.com',
        password: 'matkhau123',
        name: 'Van Anh',
      });
      expect(result).toEqual({ message: 'Mã xác thực đã được gửi tới email của bạn' });
      expect(redis.multi).toHaveBeenCalled()
      expect(mail.sendOtp).toHaveBeenCalled()
    })
    it('lưu hash của OTP vào Redis, KHÔNG lưu mã trần', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      await service.register({
        email: 'vanh@example.com',
        password: 'matkhau123',
        name: 'Van Anh',
      });
      const otpDaGui = mail.sendOtp.mock.calls[0][1];
      const duLieuLuu = multiMock.hset.mock.calls[0][1];
      expect(duLieuLuu.otpHash).not.toBe(otpDaGui);
      expect(duLieuLuu.otpHash).toBe(
        createHmac('sha256', 'secret-test').update(otpDaGui).digest('hex'),
      );
    });
    it('mã otp có đúng 6 chữ số', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      await service.register({
        email: 'vanh@example.com',
        password: 'matkhau123',
        name: 'Van Anh',
      });
      expect(mail.sendOtp).toHaveBeenCalledWith(
        'vanh@example.com',
        expect.stringMatching(/^\d{6}$/),
      );
    })
    it('password được hash', async() => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      await service.register({
        email: 'vanh@example.com',
        password: 'matkhau123',
        name: 'Van Anh',
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('matkhau123', 10);
      expect(multiMock.hset.mock.calls[0][1].passwordHash).toBe('$2b$10$hash-gia');
    })
    it('TTL đúng', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      await service.register({
        email: 'vanh@example.com',
        password: 'matkhau123',
        name: 'Van Anh',
      });
      expect(multiMock.expire).toHaveBeenCalledWith('pending:vanh@example.com', 600);
      expect(multiMock.set).toHaveBeenCalledWith('cooldown:vanh@example.com', '1', 'EX', 60);
    })
    it('chuẩn hoá email', async() =>{
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hash-gia' as never);
      await service.register({ email: '  VAnh@Example.COM  ', password: 'matkhau123', name: 'Van Anh' });
      expect(multiMock.hset).toHaveBeenCalledWith(
        'pending:vanh@example.com',
        expect.anything(),
      );
    })
  })
});