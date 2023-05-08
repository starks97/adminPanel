import { Permissions } from '@prisma/client';

import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const RoleSystemSchema = z.object({
  name: z.string().min(3, { message: 'name is too short' }).nonempty(),
  permissions: z.nativeEnum(Permissions).array().nonempty(),
});

export class CreateRoleSystemDto extends createZodDto(RoleSystemSchema) {}
