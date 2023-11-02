import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { CacheSystemService } from 'src/modules/cache-system/cache-system.service';
import { AuthErrorHandler, CustomErrorException, errorCases } from 'src/modules/utils';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cache: CacheSystemService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    if (!req.cookies) throw new AuthErrorHandler('Token', errorCases.TOKEN_NOT_FOUND, 405);

    const token = req.cookies['refresh_token'];

    if (!token) return false;

    try {
      const decodedToken = this.jwtService.verify(token, {
        secret: this.configService.get('REFRESH_JWT_KEY'),
      });

      const { email } = decodedToken;

      const refreshTokenKey = `dataUser:${email}`;

      const storedTokens = await this.cache.getTokenFromRedis(refreshTokenKey);

      console.log(storedTokens);

      if (!Array.isArray(storedTokens))
        throw new CustomErrorException({
          errorCase:
            'Unable to retrieve data from the token storage. Please check the Redis connection.',
          errorType: 'Token',
          status: 400,
        });

      if (!storedTokens.includes(token))
        throw new CustomErrorException({
          errorCase:
            'The token was provided it wasnt found in DB, please make sure you are providing the correct token',
          errorType: 'Token',
          status: 404,
        });

      return true;
    } catch (error) {
      console.error(error);

      if (error.name === 'TokenExpiredError') {
        throw new CustomErrorException({
          errorType: 'Token',
          errorCase: 'Token has expired, please login to obtain a new token.',
          status: 401, // Unauthorized
        });
      }

      if (error instanceof CustomErrorException) {
        throw error;
      }

      throw error;
    }
  }
}
