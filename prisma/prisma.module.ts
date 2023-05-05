import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { PrismaMethods } from './context';

@Global()
@Module({
  providers: [PrismaService, PrismaMethods],
  exports: [PrismaService],
})
export class PrismaModule {}
