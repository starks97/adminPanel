import { CacheShieldMiddleware } from './../../middlewares/cacheShield.midddleware';
import { JwtService } from '@nestjs/jwt';

import { CloudinarySystemModule } from '../cloudinary/cloudinary-system.module';
import { AuthModule } from '../auth/auth.module';
import { RoleSystemModule } from '../role-system/role-system.module';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  forwardRef,
  NestMiddleware,
} from '@nestjs/common';

import { PassHasherModule } from './pass-hasher/pass-hasher.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CacheSystemModule } from '../cache-system/cache-system.module';

@Module({
  controllers: [UserController],
  providers: [UserService, JwtService],
  exports: [UserService],
  imports: [
    CacheSystemModule,
    PrismaModule,
    PassHasherModule,
    RoleSystemModule,
    forwardRef(() => AuthModule),
    CloudinarySystemModule,
  ],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CacheShieldMiddleware)
      .exclude({ path: 'user', method: RequestMethod.GET })
      .forRoutes('user');
  }
}
