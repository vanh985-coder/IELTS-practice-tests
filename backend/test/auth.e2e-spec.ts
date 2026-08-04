import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service'
import { createTestApp, mailMock } from './helpers/create-test-app';
import { truncateAll } from './helpers/db';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: Redis;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    redis = app.get('REDIS_CLIENT');
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    await truncateAll(prisma);
    await redis.flushdb();
    jest.clearAllMocks();
  });

  const http = () => request(app.getHttpServer());

  it('luồng đầy đủ: register → verify → login → gọi API cần token', async () => {
    const email = 'vanh@example.com';
    const password = 'matkhau123';

    await http()
      .post('/auth/register')
      .send({ email, password, name: 'Van Anh' })
      .expect(201);

    const otp = mailMock.sendOtp.mock.calls[0][1];
    expect(otp).toMatch(/^\d{6}$/);

    await http()
      .post('/auth/verify-otp')
      .send({ email, otp })
      .expect(200);

    const login = await http()
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const token = login.body.accessToken;
    expect(token).toBeDefined();
    expect(login.body).not.toHaveProperty('refreshToken');

    const cookies = login.headers['set-cookie'];
    expect(cookies[0]).toContain('HttpOnly');
    expect(cookies[0]).toContain('SameSite=Strict');

    await http()
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await http().get('/auth/me').expect(401);
  });

  it('trả 400 khi email sai định dạng', async () => {
    await http()
      .post('/auth/register')
      .send({ email: 'khong-phai-email', password: 'matkhau123', name: 'Van Anh' })
      .expect(400);
  });

  it('trả 400 khi gửi field lạ', async () => {
    await http()
      .post('/auth/register')
      .send({ email: 'a@b.com', password: 'matkhau123', name: 'X', isAdmin: true })
      .expect(400);
  });

  it('trả 401 khi đăng nhập sai mật khẩu', async () => {
    await http()
      .post('/auth/register')
      .send({ email: 'vanh@example.com', password: 'matkhau123', name: 'Van Anh' });
    const otp = mailMock.sendOtp.mock.calls[0][1];
    await http().post('/auth/verify-otp').send({ email: 'vanh@example.com', otp });

    await http()
      .post('/auth/login')
      .send({ email: 'vanh@example.com', password: 'sai-be-bet' })
      .expect(401);
  });
});