import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MailModule } from './../mail/mail.module';
import { UserModule } from './../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from './session/session.module';
import { JwtStrategy, LocalStrategy, RefreshTokenStrategy } from './strategies';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { PrismaModule } from '../../../prisma/prisma.module';

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
    PrismaModule,
  ],
})
export class AuthModule {}
