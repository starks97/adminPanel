import { createZodDto } from 'nestjs-zod';
import { UserSchema } from './create-user.dto';

export const updateUserSchema = UserSchema.omit({
  confirmPassword: true,
  email: true,
  password: true,
}).partial();

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
