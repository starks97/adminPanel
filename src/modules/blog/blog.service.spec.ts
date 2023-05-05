import { PrismaService } from './../../../prisma/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';

import { BlogService } from './blog.service';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CACHE_MANAGER, CacheModule } from '@nestjs/common';
import { CacheSystemService } from '../cache-system/cache-system.service';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import * as redisMock from 'redis-mock';
import * as redisStore from 'cache-manager-redis-store';
import { Cache } from 'cache-manager';

describe('BlogService', () => {
  let service: BlogService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;
  let cacheService: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogService,
        PrismaService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            store: redisStore,
            host: 'localhost',
            port: 6379,
            ttl: 180,
            create: () => {
              return redisMock.createClient();
            },
          },
        },
        CacheSystemService,
      ],
      imports: [
        PrismaModule,
        CacheModule.register({
          store: redisStore,
        }),
        CacheSystemModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .overrideProvider(CacheSystemService)
      .useValue(mockDeep<CacheSystemService>())
      .compile();

    service = module.get<BlogService>(BlogService);
    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );
    cacheService = module.get<Cache>(CACHE_MANAGER);
  });
  afterEach(async () => {
    await cacheService.store.reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
