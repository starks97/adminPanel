import * as bcrypt from 'bcryptjs';

export class PasswordHasher {
  static setHashPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  static compareHashPassword(password: string, oldPassword: string) {
    return bcrypt.compareSync(password, oldPassword);
  }
}
