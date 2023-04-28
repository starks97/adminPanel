import { PrismaModule } from './../../../prisma/prisma.module';
import { Module } from '@nestjs/common';
import { RoleSystemService } from './role-system.service';
import { RoleSystemController } from './role-system.controller';

@Module({
  controllers: [RoleSystemController],
  providers: [RoleSystemService],
  imports: [PrismaModule],
  exports: [RoleSystemService],
})
export class RoleSystemModule {}
