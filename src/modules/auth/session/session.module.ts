import { CacheSystemModule } from './../../cache-system/cache-system.module';
import { Module } from '@nestjs/common';
import { SessionManagerService } from './session.service';

@Module({
  providers: [SessionManagerService],
  imports: [CacheSystemModule],
  exports: [SessionManagerService],
})
export class SessionModule {}
