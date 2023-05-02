import { Module } from '@nestjs/common';

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { PrismaModule } from 'prisma/prisma.module';
import { CacheSystemModule } from '../cache-system/cache-system.module';

@Module({
  controllers: [BlogController],
  providers: [BlogService],
  imports: [PrismaModule, CacheSystemModule],
})
export class BlogModule {}
