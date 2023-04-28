import { createZodDto } from 'nestjs-zod';
import { RoleSystemSchema } from './create-role-system.dto';

export class UpdateRoleSystemDto extends createZodDto(RoleSystemSchema) {}
