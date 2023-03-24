import { CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as redisStore from 'cache-manager-redis-store';

import { CacheSystemModule } from './cache-system.module';
import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../prisma/prisma.module';

describe('cacheSystem', () => {
  let service: CacheSystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CacheSystemModule, CacheModule.register({ store: redisStore })],
      providers: [CacheSystemService],
    }).compile();

    service = module.get<CacheSystemService>(CacheSystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
