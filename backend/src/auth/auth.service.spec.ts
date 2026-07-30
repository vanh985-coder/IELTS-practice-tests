import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from 'prisma/prisma.service';
import { MailService } from '../mail/mail.service'; 

describe('AuthService - login', () => {
  let service: AuthService;
  let prisma: any;
  let redis: any;
  let mail: any;
  let config: any;

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
    };

    redis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mail = {
      sendOtp: jest.fn(),      
    };

    config = {
      get: jest.fn(),
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

  it('service được tạo thành công', () => {
    expect(service).toBeDefined();
  });

  it('trả về accessToken khi email và mật khẩu đúng', async () => {
    prisma.user.findUnique
  }) 
});