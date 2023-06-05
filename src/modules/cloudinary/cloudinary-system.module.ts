import { Module } from '@nestjs/common';
import { CloudinarySystemService } from './cloudinary-system.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  providers: [CloudinarySystemService, CloudinaryProvider],
  exports: [CloudinarySystemService, CloudinaryProvider],
  imports: [ConfigModule],
})
export class CloudinarySystemModule {}
