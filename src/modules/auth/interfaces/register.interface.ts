import { Role, User } from '@prisma/client';

export interface RegistrationStatus {
  success: boolean;
  message: string;
  data?: Omit<User, 'lastName' | 'bio' | 'image' | 'birthday' | 'password'>;
}
