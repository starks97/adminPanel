import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';

import * as redisStore from 'cache-manager-redis-store';

@Module({
  controllers: [CacheController],
  providers: [CacheService],
})
export class CacheModule {}
