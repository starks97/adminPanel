import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createPostSchema = z.object({
  title: z.string().max(100).min(20).nonempty(),
  description: z.string().max(1000).min(100).nonempty(),
  content: z.string().max(10000).min(100).nonempty(),
});

export class CreatePostDto extends createZodDto(createPostSchema) {}
