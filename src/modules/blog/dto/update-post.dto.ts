import { createPostSchema } from './create-blog.dto';
import { createZodDto } from 'nestjs-zod';

export const updatePostSchema = createPostSchema
  .pick({
    title: true,
    description: true,
    content: true,
    tags: true,
    category: true,
  })
  .partial();

export class UpdatePostDto extends createZodDto(updatePostSchema) {}
