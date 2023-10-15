import { RegistrationStatus } from './register.interface';

export interface LoginStatus extends Omit<RegistrationStatus, 'data'> {
  data: {
    refresh_token: string;
    access_token: string;
  };
}
