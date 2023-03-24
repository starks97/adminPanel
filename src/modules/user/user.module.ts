import { Module } from '@nestjs/common';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CacheSystemModule } from '../cache-system/cache-system.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
  imports: [CacheSystemModule, PrismaModule],
})
export class UserModule {}
