import { JwtStrategy } from './strategies/jwt.strategy';
import { ForgotPassStatus } from './interfaces/forgotPass.interface';
import { PrismaService } from './../../../prisma/prisma.service';

import { ForbiddenException, Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { CreateUserDto, LoginUserDto } from './../user/dto';
import { RegistrationStatus, LoginStatus, JWTPayload } from './interfaces';

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

  private _createToken({ id, email }: JWTPayload): string {
    const payload: JWTPayload = { id, email };

    return this.jwtService.sign(payload);
  }

  private _verifyToken(token: string): JWTPayload {
    return this.jwtService.verify(token);
  }

  async ForgotPassword(token: string) {
    const decoded = this._verifyToken(token);

    if (!decoded) throw new ForbiddenException('invalid_token');

    return decoded;
  }
}
