import { JWTPayload } from './../modules/auth/interfaces/jwt.interface';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) throw new ForbiddenException('No token provided, please login to continue');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = this.jwtService.decode(token) as JWTPayload;

          req.user = decoded;
        } catch (err) {
          console.error(err);
        }
      }
      next();
    } catch (e) {
      console.log(e);
      if (e instanceof ForbiddenException) throw e;
      throw new ForbiddenException('Invalid token provided, please login to continue');
    }
  }
}
