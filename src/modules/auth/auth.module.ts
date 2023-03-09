import { MailModule } from './../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

import { Module } from '@nestjs/common';

import { UserModule } from './../user/user.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy, LocalStrategy, RefreshTokenStrategy } from './strategies';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { SessionModule } from './session/session.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, RefreshTokenStrategy],
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.SECRET_JWT_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    CacheSystemModule,
    MailModule,
    SessionModule,
  ],
})
export class AuthModule {}
