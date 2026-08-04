import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { MailService } from '../../src/mail/mail.service';

export const mailMock = { sendOtp: jest.fn() };

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(MailService)
    .useValue(mailMock)
    .compile();

  const app = moduleRef.createNestApplication();

  
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.use(cookieParser());

  await app.init();
  return app;
}