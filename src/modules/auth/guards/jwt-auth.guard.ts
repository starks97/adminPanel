import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AuthErrorHandler, CustomErrorException, errorCases } from 'src/modules/utils';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const { headers: req } = context.switchToHttp().getRequest();

    if (!req.authorization) throw new AuthErrorHandler('Token', errorCases.TOKEN_NOT_FOUND, 405);

    const token = req.authorization.replace('Bearer ', '');

    if (!token) return false;

    try {
      const decodedToken = this.jwtService.verify(token, {
        secret: this.configService.get('SECRET_JWT_KEY'),
      });

      // Attach the decoded token to the request for later use in controllers.
      req.user = decodedToken;

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
