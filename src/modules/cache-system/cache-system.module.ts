import { Module } from '@nestjs/common';
import { DEFAULT_REDIS_NAMESPACE, RedisModule } from '@liaoliaots/nestjs-redis';

import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    RedisModule.forRoot({
      readyLog: true,
      config: {
        path: process.env.REDIS_URL,
        port: 13260,
        password: process.env.REDIS_PASSWORD,
      },
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
