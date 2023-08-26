import { CloudinarySystemModule } from '../../cloudinary/cloudinary-system.module';
import { Module } from '@nestjs/common';

import { CommentService } from './comment.service';

@Module({
  providers: [CommentService],
  exports: [CommentService],
  imports: [CloudinarySystemModule],
})
export class CommentModule {}
