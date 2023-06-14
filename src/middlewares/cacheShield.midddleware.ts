import { CacheSystemService } from './../modules/cache-system/cache-system.service';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CacheShieldMiddleware implements NestMiddleware {
  constructor(private readonly cache: CacheSystemService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const { method, originalUrl } = req;

      const endpoint = originalUrl.split('/')[1];

      await next();

      if (['PATCH', 'CREATE', 'DELETE'].includes(method)) {
        let cacheConfig;
        if (endpoint === 'user') {
          cacheConfig = {
            model: 'user',
            storeKey: 'users',
            exclude: ['password'],
          };
        } else if (endpoint === 'post') {
          cacheConfig = {
            model: 'post',
            storeKey: 'posts',
            exclude: ['secretField'],
          };
        }

        if (cacheConfig) return await this.cache.cacheState(cacheConfig);
      }
    } catch (e) {
      throw new ForbiddenException(e.message);
    }
  }
}
