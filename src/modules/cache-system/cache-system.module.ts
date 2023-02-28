import { Module, CacheModule } from '@nestjs/common';

import * as redisStore from 'cache-manager-redis-store';
import { CacheSystemService } from './cache-system.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({
        store: typeof redisStore,
        host: 'redis',
        port: 32768,
        ttl: 60,
        url: 'redis://default:redispw@localhost:32768',
      }),
      isGlobal: true,
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
