import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Cache } from 'cache-manager';

import { PrismaService } from '../../../prisma/prisma.service';

type T_KEYS<T> = keyof T;

interface CacheStateProps<T> {
  model: Uncapitalize<Prisma.ModelName>;
  storeKey: string;
  exclude?: T_KEYS<T>[];
}

@Injectable()
export class CacheSystemService {
  options = new Map<string, any>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async get(key: string): Promise<any> {
    if (!this.cacheManager) return;
    if (!key || typeof key === undefined) throw new Error('Key is required');
    return await this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl: number) {
    if (!key) throw new Error('Key is required');

    if (!ttl) throw new Error('TTL is required');

    return await this.cacheManager.set(key, value, ttl);
  }

  async cacheState<T>({ model, storeKey, exclude }: CacheStateProps<T>): Promise<T[] | null> {
    const getOptions = this.options.get(model) ?? {};

    const data: T[] = await (this.prisma as any)[model].findMany(getOptions);

    if (!data) return null;

    if (exclude) {
      data?.forEach(data => {
        exclude.forEach(key => {
          delete data[key];
        });
      });
    }

    await this.set(storeKey, data, 1000);

    return data;
  }

  _configModel(model: Uncapitalize<Prisma.ModelName>, options: any) {
    this.options.set(model, options);
  }
}
