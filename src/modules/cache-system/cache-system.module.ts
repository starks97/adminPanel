import { CACHE_MANAGER, CacheModule, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';

import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      ttl: 180,
    }),
    PrismaModule,
  ],

  providers: [CacheSystemService],
  exports: [CacheSystemService],
})
export class CacheSystemModule {}

/*socket: {
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
      },*/
