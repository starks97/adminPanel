import { Module, CacheModule } from '@nestjs/common';

import * as redisStore from 'cache-manager-redis-store';
import { CacheSystemService } from './cache-system.service';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 180,
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
