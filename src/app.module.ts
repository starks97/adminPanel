import { CloudinarySystemModule } from './modules/cloudinary/cloudinary-system.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';

import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { CacheSystemModule } from './modules/cache-system/cache-system.module';
import { MailModule } from './modules/mail/mail.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoleSystemModule } from './modules/role-system/role-system.module';
import { CustomExceptionFilter } from './filter';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PrismaModule,
    BlogModule,
    CacheSystemModule,
    MailModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    RoleSystemModule,
    CloudinarySystemModule,
  ],

  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
