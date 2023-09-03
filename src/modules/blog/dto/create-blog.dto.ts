import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { Category } from '@prisma/client';

export const createPostSchema = z.object({
  title: z.string().max(100).min(20),
  description: z.string().max(1000).min(100),
  content: z.string(),
  tags: z.array(z.string().max(20).min(3)),
  category: z.nativeEnum(Category).optional(),
});

export class CreatePostDto extends createZodDto(createPostSchema) {}
