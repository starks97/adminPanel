import { ForbiddenException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWTPayload } from './../interfaces/jwt.interface';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_JWT_KEY as string,
    });
  }

  private static extractJWT(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }

    if (req.cookies && 'auth_token' in req.cookies && req.cookies.auth_token.length > 0) {
      return req.cookies.auth_token;
    }
    return null;
  }

  //return decoded token
  async validate(payload: JWTPayload) {
    if (!payload) throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);

    return payload;
  }
}
