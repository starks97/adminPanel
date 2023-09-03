import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { Category } from '@prisma/client';

export const updatePostSchema = z
  .object({
    title: z.string().max(100).min(20).optional(),
    description: z.string().max(1000).min(100).optional(),
    content: z.string(),
    tags: z.array(z.string().max(20).min(3)).optional(),
    category: z.nativeEnum(Category).optional(),
    resourcesIds: z.array(z.string()).optional(),
  })
  .optional();

export class UpdatePostDto extends createZodDto(updatePostSchema) {}
