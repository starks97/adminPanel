import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './../user/dto';
import { UserService } from './../user/user.service';
import { JWTPayload, LoginStatus, RegistrationStatus } from './interfaces';
import { SessionManagerService } from './session/session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly session: SessionManagerService,
  ) {}

  async SignUp(userData: CreateUserDto): Promise<RegistrationStatus> {
    const user = await this.userService.createUser(userData);

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_created',
        success: false,
      });
    }

    const { password, lastName, bio, image, birthday, ...rest } = user;

    return {
      message: 'user_created',
      data: rest,
      success: true,
    };
  }

  async SignIn({ email, password }: LoginUserDto): Promise<LoginStatus> {
    const user = await this.userService.FindByLogin({ email, password });

    const tokens = await this._createTokens({ id: user.id, email: user.email });

    await this.session.createSessionAndOverride(user.id, tokens.refreshToken);

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_found',
        success: false,
      });
    }

    const { id, password: pass, ...rest } = user;

    return {
      message: 'user_logged',
      data: { access_token: tokens.authToken, refresh_token: tokens.refreshToken, rest },
      success: true,
    };
  }

  async refreshToken(userId: string, token: string) {
    const userSession = await this.session.findSessionByUser(userId, token);

    const tokens = await this._createTokens({
      id: userSession.id,
      email: userSession.email,
      /*role: userSession.role,*/
    });

    await this.session.updateSession(userSession.id, tokens.refreshToken);

    return tokens.authToken;
  }

  async deleteUserSession(userId: string) {
    const userSession = await this.session.deleteSession(userId);
    return userSession;
  }

  _decodeToken(token: string) {
    return this.jwtService.decode(token);
  }

  private async _createTokens(payload: JWTPayload) {
    const [authToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('SECRET_JWT_KEY'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('REFRESH_JWT_KEY'),
        expiresIn: '7d',
      }),
    ]);

    return { authToken, refreshToken };
  }
}
