import { User } from '@prisma/client';

export interface RegistrationStatus {
  success: boolean;
  message: string;
  data?: User;
}
