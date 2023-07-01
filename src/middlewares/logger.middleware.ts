import { JWTPayload } from './../modules/auth/interfaces/jwt.interface';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

/**
 * LoggerMiddleware is an injectable class that implements the NestMiddleware interface to provide
 * logging and authentication functionality.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  /**
   * Create an instance of the LoggerMiddleware class.
   *
   * @param jwtService - The JwtService instance for decoding JWT tokens.
   */
  constructor(private readonly jwtService: JwtService) {}
  /**
   * Handle the incoming request, perform logging, and validate the authentication token.
   *
   * @param req - The incoming request object.
   * @param res - The response object.
   * @param next - The next function in the middleware chain.
   * @throws ForbiddenException if the token is not provided, is invalid, or there is a general
   *   authorization error.
   */
  use(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) throw new ForbiddenException('Token not provided, please login to continue');
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
      if (e instanceof ForbiddenException) throw e;
      throw new ForbiddenException('Invalid token , please login to continue');
    }
  }
}
