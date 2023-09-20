import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { UserSchema } from './create-user.dto';

function isNumeric(value: string) {
  parseInt(value);

  return true;
}

const numericSring = z.string().optional().refine(isNumeric, 'must be a numeric string');

const searchUserSchema = z.object({
  offset: numericSring,
  limit: numericSring,
  name: z.string().min(3, { message: 'name is too short' }).optional(),
});

export class SearchUserDto extends createZodDto(searchUserSchema) {}
