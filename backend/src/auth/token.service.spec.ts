import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let redis: any;
  let jwt: any;
  let config: any;
  let pipelineMock: any;

  const USER_ID = 'user-1';
  const EMAIL = 'vanh@example.com';

  beforeEach(async () => {
    pipelineMock = {
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };

    redis = {
      get: jest.fn(),
      del: jest.fn(),
      pipeline: jest.fn(() => pipelineMock),
    };

    jwt = {
      sign: jest.fn((payload: any, opts: any) =>
        opts.secret === 'access-secret' ? 'access-gia' : 'refresh-gia',
      ),
    };

    config = {
      get: jest.fn((key: string) => ({
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
      }[key])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: jwt },
        { provide: 'REDIS_CLIENT', useValue: redis },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('service được tạo thành công', () => {
    expect(service).toBeDefined();
  });

  describe('revoke', () => {
    it('xoá cả refresh token và grace key', async () => {
      await service.revoke(USER_ID);

      expect(redis.del).toHaveBeenCalledWith(
        `refresh:${USER_ID}`,
        `refresh:grace:${USER_ID}`,
      );
    });
  });

  describe('issuePair', () => {
    it('trả về đúng cặp access và refresh token', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.issuePair(USER_ID, EMAIL);

      expect(result).toEqual({
        accessToken: 'access-gia',
        refreshToken: 'refresh-gia',
      });
    });

    it('ký access token với secret và thời hạn đúng', async () => {
      redis.get.mockResolvedValue(null);

      await service.issuePair(USER_ID, EMAIL);

      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: USER_ID, email: EMAIL },
        { secret: 'access-secret', expiresIn: '15m' },
      );
    });

    it('ký refresh token kèm jti và thời hạn 7 ngày', async () => {
      redis.get.mockResolvedValue(null);

      await service.issuePair(USER_ID, EMAIL);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: USER_ID,
          email: EMAIL,
          jti: expect.any(String),
        }),
        { secret: 'refresh-secret', expiresIn: '7d' },
      );
    });

    it('lưu HASH của refresh token vào Redis, không lưu token trần', async () => {
      redis.get.mockResolvedValue(null);

      const { refreshToken } = await service.issuePair(USER_ID, EMAIL);

      const [key, giaTriLuu, ...phanConLai] = pipelineMock.set.mock.calls[0];

      expect(key).toBe(`refresh:${USER_ID}`);
      expect(giaTriLuu).not.toBe(refreshToken);
      expect(giaTriLuu).toBe(
        createHash('sha256').update(refreshToken).digest('hex'),
      );
      expect(phanConLai).toEqual(['EX', 7 * 24 * 3600]);
    });

    it('không tạo grace key khi chưa có token cũ', async () => {
      redis.get.mockResolvedValue(null);

      await service.issuePair(USER_ID, EMAIL);

      expect(pipelineMock.set).toHaveBeenCalledTimes(1);
    });

    it('chuyển token cũ sang grace key 30 giây khi cấp token mới', async () => {
      redis.get.mockResolvedValue('hash-cu');

      await service.issuePair(USER_ID, EMAIL);

      expect(pipelineMock.set).toHaveBeenCalledWith(
        `refresh:grace:${USER_ID}`,
        'hash-cu',
        'EX',
        30,
      );
      expect(pipelineMock.set).toHaveBeenCalledTimes(2);
    });
  });
  describe('Rotate', ()=>{
    const setupRedis = (current: string | null, grace: string | null = null) => {
        redis.get.mockImplementation(async (key: string) => {
            if (key === `refresh:${USER_ID}`) return current;
            if (key === `refresh:grace:${USER_ID}`) return grace;
            return null;
        });
    };
    const TOKEN_HOP_LE = 'refresh-token-hop-le';
    const HASH_HOP_LE = createHash('sha256').update(TOKEN_HOP_LE).digest('hex');
    it('Cấp cặp refresh token mới khi token hợp lệ', async()=>{
        const result = await service.rotate(USER_ID, EMAIL, TOKEN_HOP_LE);
    })
  })
});