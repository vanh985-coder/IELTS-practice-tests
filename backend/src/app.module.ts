import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [AuthModule, 
            RedisModule, 
            MailModule,
            ConfigModule.forRoot({
            isGlobal: true,        
              envFilePath: '.env',
            })
          ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
