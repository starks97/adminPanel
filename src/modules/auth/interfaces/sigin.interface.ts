import { User } from '@prisma/client';
import { RegistrationStatus } from './register.interface';

export interface LoginStatus extends Omit<RegistrationStatus, 'data'> {
  data?: {
    token: string;
    rest: Omit<User, 'password' | 'id'>;
  };
}
