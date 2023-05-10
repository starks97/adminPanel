import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { createPostSchema } from './create-blog.dto';

const searchPostSchema = createPostSchema.pick({ category: true }).extend({
  offset: z.onumber().optional(),
  limit: z.onumber().optional(),
});

export class SearchPostDto extends createZodDto(searchPostSchema) {}
