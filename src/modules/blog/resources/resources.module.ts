import { CloudinarySystemModule } from '../../cloudinary/cloudinary-system.module';
import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { PrismaMethods } from 'prisma/context';
import { CacheSystemModule } from 'src/modules/cache-system/cache-system.module';

@Module({
  providers: [ResourcesService],
  exports: [ResourcesService],
  imports: [CloudinarySystemModule],
})
export class ResourcesModule {}
