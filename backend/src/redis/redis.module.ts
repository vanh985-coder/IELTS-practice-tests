import { Global, Module, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>{
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) {
            throw new Error('REDIS_URL is missing');
        }
        const client = new Redis(redisUrl);
      }
        
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}