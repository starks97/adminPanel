import { Prisma, PrismaClient, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

type T_KEYS<T> = keyof T;
/*function excludeProperty<T extends object, K extends keyof T>(obj: T, excludeKey: K) {
  const { [excludeKey]: _, ...rest } = obj;
  return rest;
}*/
interface CacheStateProps<T> {
  model: Uncapitalize<Prisma.ModelName>;
  storeKey: string;
  exclude?: T_KEYS<T>[];
}

@Injectable()
export class CacheSystemService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl?: number) {
    return await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string) {
    return await this.cacheManager.del(key);
  }

  async cacheState<T>({ model, storeKey, exclude }: CacheStateProps<T>): Promise<T[] | null> {
    // const dataUser = await this.cacheState<User>()
    const data = (await this.prisma[model].findMany({})) as T[];

    if (exclude) {
      data.forEach(model => {
        exclude.forEach(excludeKey => delete model[excludeKey]);
      });
    }

    await this.set(storeKey, data, 60 * 60);

    return data;
  }
}
