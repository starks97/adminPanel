import { Module } from '@nestjs/common';
import { SessionManagerService } from './session.service';

@Module({
  providers: [SessionManagerService],
})
export class SessionModule {}
