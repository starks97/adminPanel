import { JwtService } from '@nestjs/jwt';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PrismaModule } from 'prisma/prisma.module';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { LoggerMiddleware } from 'src/middlewares/logger.middleware';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

import { CloudinarySystemModule } from '../cloudinary/cloudinary-system.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  controllers: [BlogController],
  providers: [BlogService, JwtService, LoggerMiddleware],
  imports: [
    PrismaModule,
    CacheSystemModule,
    AuthModule,
    CloudinarySystemModule,
    ConfigModule,
    ResourcesModule,
  ],
})
export class BlogModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('blog');
  }
}
