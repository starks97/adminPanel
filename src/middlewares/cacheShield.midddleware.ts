import { CacheSystemService } from './../modules/cache-system/cache-system.service';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';
/**
 * CacheShieldMiddleware is an injectable class that implements the NestMiddleware interface to
 * provide caching protection for specific endpoints.
 */
@Injectable()
export class CacheShieldMiddleware implements NestMiddleware {
  /**
   * Create an instance of the CacheShieldMiddleware class.
   *
   * @param cache - The CacheSystemService instance for caching operations.
   */
  constructor(private readonly cache: CacheSystemService) {}
  /**
   * Handle the incoming request and apply caching protection for specific endpoints.
   *
   * @param req - The incoming request object.
   * @param res - The response object.
   * @param next - The next function in the middleware chain.
   * @returns A promise that resolves to a boolean or the cached response.
   * @throws ForbiddenException if there is a general authorization error.
   */
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { method, baseUrl } = req;

      await next();

      const cacheMethods = {
        methods: ['PATCH', 'DELETE', 'POST', 'PUT'],
        path: baseUrl.split('/')[1],
      };

      if (cacheMethods.methods.includes(method)) {
        const res = this.cache.cacheInValidation(`*${cacheMethods.path}*`);

        if (!res) return false;

        return res;
      }
    } catch (e) {
      throw new ForbiddenException(e.message);
    }
  }
}
