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

  /**
   * This method is used to cache the state of a model of prisma and return the data and also
   * exclude the data that is not needed to be cached
   *
   * @example
   *   ```typescript
   *   const data = await this.cacheSystemService.cacheState({
   *     model: 'user',
   *     storeKey: 'users',
   *     exclude: ['password', 'email', 'roleName']
   *   })
   *   ```;
   *
   * @note the exclude property is optional
   *
   * # Welcome to StackEdit!
   *
   * Hi! I'm your first Markdown file in **StackEdit**. If you want to learn about StackEdit, you can read me. If you want to play with Markdown, you can edit me. Once you have finished with me, you can create new files by opening the **file explorer** on the left corner of the navigation bar.
   */

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
