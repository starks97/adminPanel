import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const UserSchema = z
  .object({
    email: z
      .string({
        required_error: 'e-mail is required',
      })
      .email({ message: 'e-mail is not valid' })
      .nonempty(),
    name: z
      .string()
      .min(3, { message: 'name is too short' })
      .nonempty(),
    password: z
      .string({
        required_error: 'password is required',
      })
      .min(8, {
        message: 'password is too short',
      })
      .nonempty(),
    confirmPassword: z.string().min(4),
    role: z.enum(['ADMIN', 'USER', 'OWNER']),
  })
  .superRefine(
    ({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: 'custom',
          message: 'The passwords did not match',
        });
      }
    },
  );

export class CreateAuthDto extends createZodDto(
  UserSchema,
) {}
