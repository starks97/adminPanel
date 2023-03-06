import { MailModule } from './../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';

import { Module, CACHE_MANAGER } from '@nestjs/common';

import { CacheSystemService } from '../cache-system/cache-system.service';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from './../user/user.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtStrategy } from './strategies/jwt.strategy';
import { CacheSystemModule } from '../cache-system/cache-system.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  imports: [
    UserModule,
    JwtModule.register({
      secret: process.env.SECRET_JWT_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    CacheSystemModule,
    MailModule,
  ],
})
export class AuthModule {}
