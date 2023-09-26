import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWTPayload } from './../interfaces/jwt.interface';
import { ConfigService } from '@nestjs/config';
import { AUTH_TOKEN } from 'src/consts';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      ignoreExpiration: false,
      secretOrKey: configService.get('SECRET_JWT_KEY'),
    });
  }

  private static extractJWT(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
      return authHeader.split(' ')[1];
    }

    if (req.cookies && AUTH_TOKEN in req.cookies && req.cookies.auth_token.length > 0) {
      return req.cookies.auth_token;
    }
    return null;
  }

  async validate(payload: JWTPayload) {
    if (!payload)
      throw new HttpException(
        'Invalid token, please login to obtain the correct token',
        HttpStatus.UNAUTHORIZED,
      );

    return payload;
  }
}
