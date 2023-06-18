import { CacheSystemService } from './../modules/cache-system/cache-system.service';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CacheShieldMiddleware implements NestMiddleware {
  constructor(private readonly cache: CacheSystemService) {}
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
