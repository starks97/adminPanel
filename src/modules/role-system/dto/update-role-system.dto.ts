import { Permissions } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateRoleSystemSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'name is too short' })
      .max(25, { message: 'name is too long' })
      .optional(),
    permissions: z.nativeEnum(Permissions).array().optional(),
  })
  .optional();

export class UpdateRoleSystemDto extends createZodDto(UpdateRoleSystemSchema) {}
