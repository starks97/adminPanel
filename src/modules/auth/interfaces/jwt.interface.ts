import { Roles } from '@prisma/client';

export interface JWTPayload {
  id: string;
  email: string;
  role: Roles;
}
