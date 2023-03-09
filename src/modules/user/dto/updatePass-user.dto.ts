import { createZodDto } from 'nestjs-zod';
import { UserSchema } from './create-user.dto';

export const updateUserPasswordSchema = UserSchema.omit({
  confirmPassword: true,
  email: true,
  name: true,
  role: true,
  refreshToken: true,
}).partial();

export class UpdateUserPasswordDto extends createZodDto(updateUserPasswordSchema) {}
