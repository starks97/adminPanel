import { CacheSystemModule } from './../../cache-system/cache-system.module';
import { Module } from '@nestjs/common';
import { RoleSystemService } from './role-system.service';

@Module({
  providers: [RoleSystemService],
  exports: [RoleSystemService],
  imports: [CacheSystemModule],
})
export class RoleSystemModule {}
