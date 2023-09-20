import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JWTPayload } from '../interfaces';
import { REFRESH_TOKEN } from 'src/consts';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.get('REFRESH_JWT_KEY'),
      passReqToCallback: true,
    });
  }

  private static extractJWT(req: Request): string | null {
    if (req.cookies && REFRESH_TOKEN in req.cookies && req.cookies.refresh_token.length > 0) {
      return req.cookies.refresh_token;
    }
    return null;
  }

  async validate(payload: any) {
    if (!payload) throw new Error('Invalid token');

    return payload;
  }
}
