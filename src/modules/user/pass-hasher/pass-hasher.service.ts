import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PassHasherService {
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, oldPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, oldPassword);
  }
}
