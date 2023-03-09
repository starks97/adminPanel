import { ForbiddenException, Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JWTPayload } from './interfaces';
import { UpdateUserPasswordDto } from './../user/dto/updatePass-user.dto';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ForgotPassStatus, ForgotPassPayload } from './interfaces/forgotPass.interface';
import { PrismaService } from './../../../prisma/prisma.service';

import { CreateUserDto, LoginUserDto } from './../user/dto';
import { RegistrationStatus, LoginStatus } from './interfaces';

import { UserService } from './../user/user.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly jwt: JwtStrategy,
    private readonly configService: ConfigService,
  ) {}

  async SignUp(userData: CreateUserDto): Promise<RegistrationStatus> {
    const user = await this.userService.createUser(userData);

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_created',
        success: false,
      });
    }

    return {
      message: 'user_created',
      data: user,
      success: true,
    };
  }

  async SignIn({ email, password }: LoginUserDto): Promise<LoginStatus> {
    const user = await this.userService.FindByLogin({ email, password });

    if (!user) {
      throw new ForbiddenException({
        message: 'user_not_found',
        success: false,
      });
    }

    const { id, password: pass, ...rest } = user;

    const token = this._createToken({ id, email });

    return {
      message: 'user_logged',
      data: { token, rest },
      success: true,
    };
  }

  private _createToken(payload: JWTPayload | ForgotPassPayload): string {
    return this.jwtService.sign(payload);
  }

  _verifyToken(token: string): JWTPayload {
    return this.jwtService.verify(token);
  }

  async ForgotPassword(email: string, id: string): Promise<ForgotPassStatus> {
    const user = await this.userService.FindUserById(id);

    const forgotToken = Math.random().toString(36).substring(2, 15);

    const new_token = this._createToken({ id: user.id, email: user.email, forgotToken });

    delete user.password;

    await this.mailService.sendUserConfirmation(user, new_token);

    return {
      message: 'email_sent',
      data: { id: user.id, email, forgotToken },
      success: true,
    };
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
