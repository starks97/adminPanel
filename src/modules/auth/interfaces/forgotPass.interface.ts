import { RegistrationStatus } from './register.interface';

export interface ForgotPassStatus extends Omit<RegistrationStatus, 'data'> {
  data?: {
    email: string;
  };
}
