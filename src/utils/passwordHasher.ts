import CryptoES from 'crypto-es';

export default class PasswordHasher {
  static setHashPassword(password: string) {
    const hashedPassword = CryptoES.SHA256(password).toString(CryptoES.enc.Base64);
    return hashedPassword;
  }

  static compareHashPassword(password: string, oldPassword: string) {
    const hashedPassword = PasswordHasher.setHashPassword(password);

    return hashedPassword === oldPassword;
  }
}
