import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisService } from '@liaoliaots/nestjs-redis';

import { PrismaService } from '../../../prisma/prisma.service';
import Redis from 'ioredis';

type T_KEYS<T> = keyof T;

export interface CacheStateProps<T> {
  model: Uncapitalize<Prisma.ModelName>;
  storeKey: string;
  exclude?: T_KEYS<T>[];
}

export interface CachePagProps<T> extends Omit<CacheStateProps<T>, 'model' | 'exclude'> {
  newKey: string;
  offset: number;
  limit: number;
}

/**
 * # Cache System Service
 *
 * ## Description
 *
 * The CacheSystemService class provides methods for caching and retrieving data using Redis. It
 * also allows configuring cache options for Prisma models and managing cache keys.
 *
 * ## Methods
 *
 * - Get
 * - Set
 * - CacheState
 * - _configModel
 * - CachePagination
 * - CacheInvalidation
 *
 * ## Options
 *
 * - Options
 *
 * ## Usage
 *
 * ```typescript
 * import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
 * import { Cache } from 'cache-manager';
 * ```
 *
 * ## Notes
 *
 * - The **Cache** interface is used to define the structure of the data returned by the **Get** and
 *   **Set** methods.
 * - The **CacheManager** class is used to cache data in a store.
 * - The **Injectable** decorator is used to mark a class as a dependency injection token.
 * - The **Inject** decorator is used to inject a dependency into a class.
 * - The **CACHE_MANAGER** token is used to inject the **CacheManager** class.
 *
 * ## Links
 *
 * @module CacheSystem
 * @version 1.0.0
 * @category CacheSystem
 * @see {@link options}
 * @see {@link get}
 * @see {@link set}
 * @see {@link cacheState}
 * @see {@link _configModel}
 * @see {@link cachePagination}
 * @see {@link cacheInvalidation}
 */
@Injectable()
export class CacheSystemService {
  options = new Map<string, any>();
  private readonly redis: Redis;

  constructor(private readonly cache: RedisService, private readonly prisma: PrismaService) {
    this.redis = this.cache.getClient();
  }

  /**
   * Retrieve a value from the cache based on the specified key.
   *
   * @param key - The key associated with the value in the cache.
   * @returns A promise that resolves to the retrieved value, or `undefined` if the key is not found
   *   in the cache.
   * @throws Error if the key is not provided.
   */
  async get(key: string) {
    if (!this.cache) return;
    if (!key || typeof key === undefined) throw new Error('Key is required');
    return await this.redis.get(key);
  }

  /**
   * Set a value in the cache with the specified key and time-to-live (TTL) in seconds.
   *
   * @param key - The key to associate with the value.
   * @param value - The value to be stored in the cache.
   * @param ttl - The time-to-live (TTL) in seconds for the cached value.
   * @returns A promise that resolves when the value has been successfully set in the cache.
   * @throws Error if the key or TTL is not provided.
   */
  async set(key: string, value: any, ttl: number) {
    if (!key) throw new Error('Key is required');

    if (!ttl) throw new Error('TTL is required');

    return this.redis.set(key, value, 'EX', ttl);
  }

  /**
   * Cache the state of a specific Prisma model.
   *
   * @param model - The name of the Prisma model.
   * @param storeKey - The key under which to store the cached data.
   * @param exclude - An optional array of keys to exclude from the cached data.
   * @returns The cached data.
   */

  async cacheState<T>({ model, storeKey, exclude }: CacheStateProps<T>) {
    const getOptions = this.options.get(model) ?? {};

    const data: T[] = await (this.prisma as any)[model].findMany({
      ...getOptions,
    });

    if (!data) return null;

    if (exclude) {
      data?.forEach(data => {
        exclude.forEach(key => {
          delete data[key];
        });
      });
    }

    this.set(storeKey, JSON.stringify(data), 600);

    return data;
  }

  /**
   * Configure options for a specific Prisma model.
   *
   * @param model - The name of the Prisma model to configure (in lowercase).
   * @param options - The options to set for the model.
   */
  _configModel(model: Uncapitalize<Prisma.ModelName>, options: any) {
    this.options.set(model, options);
  }
  /**
   * Cache and retrieve paginated data from the cache.
   *
   * @param limit - The limit of items per page.
   * @param newKey - The new key for the paginated data.
   * @param storeKey - The key of the stored data to paginate.
   * @param offset - The offset of the pagination.
   * @returns The paginated data retrieved from the cache, or `null` if the data is not found.
   * @throws HttpException if there is an error retrieving or caching the pagination data.
   */
  async cachePagination<T>({ limit, newKey, storeKey, offset }: CachePagProps<T>) {
    const dataString = JSON.parse(await this.redis.get(`${newKey}:${offset}:${limit}`));

    if (dataString) return dataString;

    try {
      const data = await this.get(storeKey);

      if (!data) return null;

      const dataArray = JSON.parse(data);

      const startIndex = Math.max((offset - 1) * limit, 0);
      const endIndex = startIndex + limit;

      const newData = dataArray.slice(startIndex, endIndex);

      this.set(`${newKey}:${offset}:${limit}`, JSON.stringify(newData), 60 * 2);

      return newData;
    } catch (e) {
      console.log('error from cachePagination', e);
      throw new HttpException(
        'Failed to retrieve or cache pagination data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  /**
   * Delete keys from the cache that match a specified pattern.
   *
   * @param pattern - The pattern of keys to delete.
   * @returns A promise that resolves to `true` if the keys were successfully deleted, or `false` if
   *   not.
   * @throws HttpException if the pattern is not provided, or there is an error deleting keys.
   */
  async cacheInValidation(pattern: string) {
    if (!pattern)
      throw new HttpException(
        'pattern was not provided, please provide the pattern of keys',
        HttpStatus.NOT_ACCEPTABLE,
      );

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return false;

      const deleteKeys = await this.redis.del(...keys);
      if (deleteKeys !== keys.length) return false;

      return true;
    } catch (e) {
      console.log('error from cacheInValidation', e);
      throw new HttpException('error deleting keys', HttpStatus.BAD_REQUEST);
    }
  }
}
