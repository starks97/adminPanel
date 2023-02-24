import { PrismaModule } from './../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CacheModule } from './modules/cache/cache.module';
import { BlogModule } from './modules/blog/blog.module';
@Module({
  imports: [AuthModule, UserModule, PrismaModule, CacheModule, BlogModule],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
