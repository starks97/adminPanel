import { Module, CACHE_MANAGER } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BlogModule } from './modules/blog/blog.module';

import { PrismaModule } from './../prisma/prisma.module';
import { CacheSystemModule } from './modules/cache-system/cache-system.module';
import { CacheSystemService } from './modules/cache-system/cache-system.service';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [AuthModule, UserModule, PrismaModule, BlogModule, CacheSystemModule, MailModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
