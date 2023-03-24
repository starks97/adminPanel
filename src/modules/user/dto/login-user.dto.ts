import { createZodDto } from 'nestjs-zod';

import { UserSchema } from './create-user.dto';

const loginSchema = UserSchema.pick({
  email: true,
  password: true,
});

export class LoginUserDto extends createZodDto(loginSchema) {}
