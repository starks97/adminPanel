import { Module } from '@nestjs/common';
import { CloudinarySystemService } from './cloudinary-system.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [CloudinarySystemService],
  exports: [CloudinarySystemService],
  imports: [ConfigModule],
})
export class CloudinarySystemModule {}
