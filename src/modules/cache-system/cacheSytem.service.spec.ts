import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { CacheSystemModule } from './cache-system.module';
import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaService } from '../../../prisma/prisma.service';

import Redis from 'ioredis-mock';
const redisMock = new Redis();

describe('cacheSystem', () => {
  let redis = redisMock;

  const cache = {
    key: 'test-key',
    value: 'test-value',
    ttl: 60,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CacheSystemModule],
      providers: [
        CacheSystemService,
        {
          provide: Redis,
          useValue: redis,
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())

      .compile();

    redis = module.get(Redis);
  });

  afterEach(async () => {
    await redis.flushall();
  });

  describe('set', () => {
    it('should return a value if key exists in cache', async () => {
      redis.set(cache.key, cache.value, 'EX', 60);

      const result = await redis.get(cache.key);

      expect(result).toEqual(cache.value);
    });

    it('should return error if key does not exist in cache', async () => {
      const key = undefined;

      await expect(redis.get(key)).resolves.toBeNull();
    });

    it('should return error if ttl does not exist in cache', async () => {
      const ttl = undefined;

      await expect(redis.get(ttl)).resolves.toBeNull();
    });
  });

  describe('get', () => {
    it('should return a value if key exists in cache', async () => {
      await redis.set(cache.key, cache.value, 'EX', 60);

      const result = await redis.get(cache.key);

      expect(result).toEqual(cache.value);
    });

    it('should return null if key does not exist in cache', async () => {
      await redis.set(cache.key, cache.value, 'EX', 60);

      const result = await redis.get('test-key-2');

      expect(result).toBeNull();
    });
  });
});
