import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

type T_KEYS<T> = keyof T;
/*function excludeProperty<T extends object, K extends keyof T>(obj: T, excludeKey: K) {
  const { [excludeKey]: _, ...rest } = obj;
  return rest;
}*/
interface CacheStateProps<T> {
  models: Uncapitalize<Prisma.ModelName>[];
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

  async set(key: string, value: any, ttl: number) {
    return await this.cacheManager.set(key, value, ttl);
  }

  async cacheState<T>({ models, storeKey, exclude }: CacheStateProps<T>): Promise<T[][] | null> {
    // const dataUser = await this.cacheState<User>()

    const data = await Promise.all(
      models.map(async model => {
        const modelData: T[] = await (this.prisma as any)[model].findMany({});

        if (exclude) {
          modelData.map(data => {
            exclude.map(key => {
              delete data[key];
            });
          });
        }
        return modelData;
      }),
    );

    await this.set(storeKey, data, 1000);

    return data;
  }
}
