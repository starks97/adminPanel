import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const UserSchema = z.object({
  email: z
    .string({
      required_error: 'e-mail is required',
    })
    .email({ message: 'e-mail is not valid' })
    .nonempty(),
  name: z.string().min(3, { message: 'name is too short' }).nonempty(),
  password: z
    .string({
      required_error: 'password is required',
    })
    .min(8, {
      message: 'password is too short, please use at least 8 characters',
    })
    .nonempty(),
});

export class CreateUserDto extends createZodDto(UserSchema) {}
