import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as redisStore from 'cache-manager-redis-store';
import * as redisMock from 'redis-mock';

import { CacheSystemModule } from './cache-system.module';
import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { Cache } from 'cache-manager';

describe('cacheSystem', () => {
  let service: CacheSystemService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CacheSystemModule, CacheModule.register({ store: redisStore })],
      providers: [
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
      ],
    }).compile();

    service = module.get<CacheSystemService>(CacheSystemService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(async () => {
    await cacheManager.store.reset();
  });

  describe('set', () => {
    it('should return a value if key exists in cache', async () => {
      const key = 'test-key';
      const value = 'test-value';
      await cacheManager.set(key, value, 1000);
      const result = await service.get(key);
      expect(result).toEqual(value);
    });

    it('should return error if key does not exist in cache', async () => {
      const key = 'test-key';

      try {
        await service.get(key);
      } catch (e) {
        expect(e.message).toEqual('Key not found in cache');
      }
    });
  });

  describe('get', () => {});
});
