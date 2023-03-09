import { JWTPayload } from './jwt.interface';
import { RegistrationStatus } from './register.interface';

export interface ForgotPassStatus extends Omit<RegistrationStatus, 'data'> {
  data?: {
    id: string;
    email: string;
    forgotToken: string;
  };
}

export interface ForgotPassPayload extends JWTPayload {
  forgotToken: string;
}
