import { CACHE_MANAGER, CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { Cache } from 'cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import * as redisMock from 'redis-mock';

import { CacheSystemModule } from './cache-system.module';
import { CacheSystemService } from './cache-system.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaService } from '../../../prisma/prisma.service';

describe('cacheSystem', () => {
  let service: CacheSystemService;
  let cacheManager: Cache;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;

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
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())

      .compile();

    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );
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
      const key = '';

      expect(service.get(key)).rejects.toThrowError('Key is required');
    });

    it('should return error if ttl does not exist in cache', async () => {
      const key = 'test-key';
      const value = 'test-value';

      const ttl = undefined;

      expect(service.set(key, value, ttl)).rejects.toThrowError('TTL is required');
    });
  });

  describe('get', () => {
    it('should return a value if key exists in cache', async () => {
      const key = 'test-key';

      const value = 'test-value';

      await cacheManager.set(key, value, 1000);

      const result = await service.get(key);

      expect(result).toEqual(value);
    });
  });

  describe('cacheState', () => {
    const mockedUser = {
      id: '1234',
      email: 'diablos@diablos.com',
      name: 'diablos',
      lastName: 'lucifer',
      bio: 'bio',
      image: 'image',
      birthday: new Date(),
      roleName: 'PUBLIC',
      password: 'password',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should cache data to cache manager with TTL', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockedUser]);
      await service.cacheState({
        model: 'user',
        storeKey: 'test-cache',
        exclude: ['password'],
      });
      const result = await service.get('test-cache');
      expect(result).toEqual([
        {
          ...mockedUser,
          createdAt: mockedUser.createdAt.toISOString(),
          updatedAt: mockedUser.updatedAt.toISOString(),
          birthday: mockedUser.birthday.toISOString(),
        },
      ]);
    });

    it('should cache data with default TTL', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockedUser]);
      await service.cacheState({
        model: 'user',
        storeKey: 'test-cache',
        exclude: ['password'],
      });
      const ttl = 1000;
      expect(ttl).toBe(1000);
    });

    it('should not cache if data is not found', async () => {
      prismaMock.user.findMany.mockResolvedValue(null);
      await service.cacheState({
        model: 'user',
        storeKey: 'test-cache',
        exclude: ['password'],
      });
      const result = await service.get('test-cache');
      expect(result).toBeNull();
    });

    it('should exclude specified fields from cached data', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockedUser]);
      await service.cacheState({
        model: 'user',
        storeKey: 'test-cache',
        exclude: ['password'],
      });
      const result = await service.get('test-cache');
      expect(result[0].password).toBeUndefined();
    });

    it('should not exclude any fields if exclude parameter is not provided', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockedUser]);
      await service.cacheState({
        model: 'user',
        storeKey: 'test-cache',
      });
      const result = await service.get('test-cache');
      expect(result).toEqual([
        {
          ...mockedUser,
          createdAt: mockedUser.createdAt.toISOString(),
          updatedAt: mockedUser.updatedAt.toISOString(),
          birthday: mockedUser.birthday.toISOString(),
        },
      ]);
    });
  });
});
