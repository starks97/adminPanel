import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { UserSchema } from './create-user.dto';

export const updateUserPasswordSchema = z.object({
  oldPassword: z
    .string({
      required_error: 'Please provide your old password',
    })
    .nonempty(),
  newPassword: z
    .string({
      required_error: 'new password is required',
    })
    .min(8, {
      message: 'password is too short, please use at least 8 characters',
    }),
});

export class UpdateUserPasswordDto extends createZodDto(updateUserPasswordSchema) {}
