import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let tokenService: any;
  let config: any;
  let res: any;
  const REFRESH_COOKIE = 'refresh_token';
  const REFRESH_PATH = '/auth/refresh';
  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      register: jest.fn(),
      VerifyOTP: jest.fn(),
      GetProfile: jest.fn(),
    };

    tokenService = {
      issuePair: jest.fn(),
      rotate: jest.fn(),
      revoke: jest.fn(),
    };

    config = {
      get: jest.fn()
    };

    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: TokenService, useValue: tokenService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('controller được tạo thành công', () => {
    expect(controller).toBeDefined();
  });
  describe('Login', () => {
    it('trả về accessToken và user, KHÔNG trả refreshToken trong body', async () => {
            authService.login.mockResolvedValue({
                id: 'user-uuid-1',
                email: 'vanh@example.com',
            });
            tokenService.issuePair.mockResolvedValue({
                accessToken: 'access-gia',
                refreshToken: 'refresh-gia',
            });

            const result = await controller.Login(
                { email: 'vanh@example.com', password: 'matkhau123' },
                res,
            );
            expect(result).toEqual({
                accessToken: 'access-gia',
                user: { id: 'user-uuid-1', email: 'vanh@example.com' },
            });
            expect(result).not.toHaveProperty('refreshToken');
        });
    it('res.cookie được gọi với các tham số đã khởi tạo', async()=>{
        authService.login.mockResolvedValue({
            id: 'user-uuid-1',
            email: 'vanh@example.com',
        });
        tokenService.issuePair.mockResolvedValue({
            accessToken: 'access-gia',
            refreshToken: 'refresh-gia',
        });

        const result = await controller.Login(
            { email: 'vanh@example.com', password: 'matkhau123' },
            res,
        );
        expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refresh-gia', expect.objectContaining({ 
                httpOnly: true, 
                sameSite: 'strict' ,
                path: REFRESH_PATH
            }))   
        })
    });
    describe('Cookie', ()=>{
        it('Nếu NODE_ENV là production thì secure là true', async()=>{
            config.get.mockReturnValue('production');
            authService.login.mockResolvedValue({
            id: 'user-uuid-1',
            email: 'vanh@example.com',
            });
            tokenService.issuePair.mockResolvedValue({
                accessToken: 'access-gia',
                refreshToken: 'refresh-gia',
            });
            const result = await controller.Login(
                { email: 'vanh@example.com', password: 'matkhau123' },
                res,
            );
            expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refresh-gia', expect.objectContaining({ 
                httpOnly: true, 
                sameSite: 'strict' ,
                path: REFRESH_PATH,
                secure: true
            }))   
        })
        it('Nếu NODE_ENV là development thì secure là false', async()=>{
            config.get.mockReturnValue('development');
            authService.login.mockResolvedValue({
            id: 'user-uuid-1',
            email: 'vanh@example.com',
            });
            tokenService.issuePair.mockResolvedValue({
                accessToken: 'access-gia',
                refreshToken: 'refresh-gia',
            });
            const result = await controller.Login(
                { email: 'vanh@example.com', password: 'matkhau123' },
                res,
            );
            expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refresh-gia', expect.objectContaining({ 
                httpOnly: true, 
                sameSite: 'strict' ,
                path: REFRESH_PATH,
                secure: false
            }))   
        })
    })
    describe('Logout', ()=>{
        it('Logout gọi tokenService.revoke và res.clearCookie', async()=>{
            const req: any = { user: { userId: 'user-uuid-1' } };
            await controller.logout(req, res)
            expect(tokenService.revoke).toHaveBeenCalledWith('user-uuid-1');
            expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_COOKIE, { path: REFRESH_PATH });
        })
    })
    describe('Refresh token', ()=>{
        it ('Refreshtoken được gọi', async()=>{
            const req: any = {
                user: { userId: 'user-uuid-1', email: 'vanh@example.com' },
                cookies: { [REFRESH_COOKIE]: 'refresh-cu' },
            };
            const present = 'refresh-token'
            tokenService.rotate.mockResolvedValue({
                accessToken: 'accesstoken-moi',
                refreshToken: 'refreshtoken-moi',
            });
            const result = await controller.refresh(req, res)
            expect(tokenService.rotate).toHaveBeenCalledWith(
                'user-uuid-1',
                'vanh@example.com',
                'refresh-cu',
            );
            expect(result).toEqual({ accessToken: 'accesstoken-moi' });
            expect(result).not.toHaveProperty('refreshToken');
            expect(res.cookie).toHaveBeenCalledWith(REFRESH_COOKIE, 'refreshtoken-moi', expect.objectContaining({ 
                httpOnly: true, 
                sameSite: 'strict' ,
                path: REFRESH_PATH,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            }))   
        })
    })
});