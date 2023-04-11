import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PassHasherModule } from './pass-hasher/pass-hasher.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
  imports: [CacheSystemModule, PrismaModule, PassHasherModule],
})
export class UserModule {}
