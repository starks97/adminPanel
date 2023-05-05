import { AuthModule } from '../auth/auth.module';
import { RoleSystemModule } from '../role-system/role-system.module';
import { Module, forwardRef } from '@nestjs/common';

import { PassHasherModule } from './pass-hasher/pass-hasher.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CacheSystemModule } from '../cache-system/cache-system.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
  imports: [
    CacheSystemModule,
    PrismaModule,
    PassHasherModule,
    RoleSystemModule,
    forwardRef(() => AuthModule),
  ],
})
export class UserModule {}
