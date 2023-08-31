import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { createPostSchema } from './create-blog.dto';

function isNumeric(value: string) {
  const num = parseInt(value);

  return true;
}
const numericSring = z.string().optional().refine(isNumeric, 'must be a numeric string');
const searchPostSchema = createPostSchema.pick({ category: true }).extend({
  offset: numericSring,
  limit: numericSring,
  tags: z.array(z.string()).optional(),
  title: z.string().optional(),
});

export class SearchPostDto extends createZodDto(searchPostSchema) {}
