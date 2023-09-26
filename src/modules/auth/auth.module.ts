import { ConfigService } from '@nestjs/config';
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { MailModule } from './../mail/mail.module';
import { UserModule } from './../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionModule } from './session/session.module';
import { JwtStrategy, LocalStrategy, RefreshTokenStrategy } from './strategies';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { RoleGuard } from './guards/role.guard';
import { PassHasherModule } from '../user/pass-hasher/pass-hasher.module';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
    RoleGuard,
    ConfigService,
  ],
  imports: [
    forwardRef(() => UserModule),
    JwtModule.register({
      secret: process.env.SECRET_JWT_KEY,
      signOptions: { expiresIn: '1d' },
    }),
    CacheSystemModule,
    MailModule,
    SessionModule,
    PrismaModule,
    PassHasherModule,
  ],
  exports: [AuthService, RoleGuard],
})
export class AuthModule {}
