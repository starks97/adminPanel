import { createZodDto } from 'nestjs-zod';
import { UserSchema } from './create-user.dto';
import { z } from 'nestjs-zod/z';

const UserProfileSchema = z.object({
  bio: z
    .string()
    .min(40, { message: 'bio is too short, please use at least 40 characters' })
    .max(120, { message: 'bio is too long, please use at least 120 characters' })
    .optional(),
  lastName: z.string().min(3, { message: 'lastName is too short' }).nonempty(),
  birthday: z.date().optional(),
});

export class ProfileUserDto extends createZodDto(UserProfileSchema) {}
