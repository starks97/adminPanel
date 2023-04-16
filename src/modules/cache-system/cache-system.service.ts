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

/**
 * # Cache System Service!
 *
 * ## Description
 *
 * This service provides methods for caching data in a store.
 *
 * ## Methods
 *
 * - Get
 * - Set
 * - CacheStateManager
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
 * -
 */
@Injectable()
export class CacheSystemService {
  /**
   * # Variable: options!
   *
   * ## Description
   *
   * The **Options** variable is an instance of a **Map** object used to store key-value pairs
   * representing various options that can be used in a particular context.
   *
   * ## Usage
   *
   * The **Options** object can be used to store and retrieve options for use in a particular
   * context. Each option is represented as a key-value pair, where the key is a string representing
   * the name of the option and the value is any value that is appropriate for the option.
   *
   * @example
   *   ```typescript
   *   this.options.set('ttl', 1000);
   *   ```
   *   ## Notes
   *
   * @notes - The **Map** object is a built-in object in JavaScript that provides an easy-to-use interface for storing and retrieving key-value pairs.
   * - The **Options** object can be used in any context where options need to be stored and retrieved, such as configuration settings, user preferences, or application state.
   */

  options = new Map<string, any>();

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * # Get Cache!
   *
   * ## Description
   *
   * This method retrieves a value from the cache store using a specified key.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const cache = new CacheManager();
   *   await cache.set('my-key', { foo: 'bar' }, 60);
   *   const result = await cache.get('my-key'); // result: { foo: 'bar' }
   *
   *   ```
   *
   *   ## Parameters
   *
   * @param - Key: A string representing the key to use when retrieving the data.
   *
   *   ## Returns
   * @returns This method returns a Promise that resolves to the cached value associated with the
   *   provided key. If the key does not exist in the cache, the method will return
   *
   *   **Undefined**.
   *
   *   ## Errors
   * @errors If the key parameter is not provided, this method throws an Error with a corresponding message.
   *
   * ## Notes
   * @note Cached data is stored in memory and will be lost if the application is restarted.
   */

  async get(key: string): Promise<any> {
    if (!this.cacheManager) return;
    if (!key || typeof key === undefined) throw new Error('Key is required');
    return await this.cacheManager.get(key);
  }

  /**
   * # Set Cache!
   *
   * ## Description
   *
   * This method sets a key-value pair in the cache store.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const cache = new CacheManager();
   *   await cache.set('my-key', { foo: 'bar' }, 60);
   *
   *
   *   ```
   *
   *   ## Parameters
   *
   * @param - Key: A string representing the key to use when caching the data.
   *
   *   - Value: A string representing the value to cache.
   *   - TTL: A number representing the time to live for the cached data.
   *
   *   ## Returns
   * @returns A boolean representing the success of the operation.
   *
   *   ## Errors
   * @errors - If the key or ttl parameters are not provided, this method throws an Error with a corresponding message.
   *
   * ## Notes
   * @note - Cached data is stored in memory and will be lost if the application is restarted.
   */

  async set(key: string, value: any, ttl: number) {
    if (!key) throw new Error('Key is required');

    if (!ttl) throw new Error('TTL is required');

    return await this.cacheManager.set(key, value, ttl);
  }

  /**
   * # Cache State Manager!
   *
   * ## Description
   *
   * This method retrieves data from a Prisma model and caches it in a store using a specified key.
   * The cached data is stored for a fixed duration of 1000ms, after which it is invalidated and the
   * next retrieval will trigger a new cache.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const data = await this.cacheSystemService.cacheState({
   *   model: 'user',
   *   storeKey: 'users',
   *   exclude: ['password', 'email', 'roleName']
   *   })
   *
   *   ```
   *
   *   ## Parameters
   *
   * @param - Model: A string representing the name of the Prisma model to query.
   *
   *   - StoreKey: A string representing the key to use when caching the data.
   *   - Exclude: An array of strings representing the keys to exclude from the cached data.
   *
   *   ## Returns
   * @returns An array of objects representing the data retrieved from the Prisma model, or
   *   **Null**.
   *
   *   ## Notes
   * @note - This method uses the findMany() method provided by Prisma to retrieve data from the specified model.
   * - The exclude parameter is useful when sensitive data should not be cached, such as passwords or API keys.
   * - Cached data is stored in memory and will be lost if the application is restarted.
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

  /**
   * # Config Model!
   *
   * ## Description
   *
   * This method is used to configure **Options** for a particular Prisma model. It takes in the
   * name of the model and a set of options and stores them in the options object.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const options = {
   *   someOption: 'value',
   *   anotherOption: true,
   *   };
   *   _configModel('user', options);
   *   ```
   *
   *   ## Parameters
   *
   * @param - Model: A string representing the name of the Prisma model to query.
   *
   *   - Options: An object representing the options to use when querying the model.
   *
   *   ## Returns
   * @returns This method does not return a value.
   */

  _configModel(model: Uncapitalize<Prisma.ModelName>, options: any) {
    this.options.set(model, options);
  }
}
