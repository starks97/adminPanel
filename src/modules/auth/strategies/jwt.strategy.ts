import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    if (req.cookies && 'auth_token' in req.cookies && req.cookies.auth_token.length > 0) {
      return req.cookies.auth_token;
    }
    return null;
  }

  //return decoded token
  async validate(payload: JWTPayload) {
    if (!payload) throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);

    /*const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { role: true },
    });

    if (!user) throw new ForbiddenException('user_not_found');

    if (user.role === Roles.PUBLIC) {
      throw new InternalServerErrorException('the_user_has_not_authorization');
    }*/

    return payload;
  }
}
