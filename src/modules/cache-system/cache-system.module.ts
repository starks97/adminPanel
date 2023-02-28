import { Module, CacheModule } from '@nestjs/common';

import * as redisStore from 'cache-manager-redis-store';
import { CacheSystemService } from './cache-system.service';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore as any,
      host: 'localhost',
      port: 6379,
      ttl: 60 * 60 * 24,
    }),
  ],

  providers: [CacheSystemService],
  exports: [CacheSystemService],
})
export class CacheSystemModule {}

/*socket: {
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
      },*/
