import { PrismaModule } from './../../../prisma/prisma.module';
import { Module, forwardRef } from '@nestjs/common';
import { RoleSystemService } from './role-system.service';
import { RoleSystemController } from './role-system.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [RoleSystemController],
  providers: [RoleSystemService],
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  exports: [RoleSystemService],
})
export class RoleSystemModule {}
