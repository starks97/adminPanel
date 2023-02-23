import { JWTPayload } from './../interfaces/jwt.interface';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req?.cookies?.admin_token) {
          return null;
        }
        return req?.cookies?.admin_token;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET_JWT_KEY as string,
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.authService.ValidateUser(payload);
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
