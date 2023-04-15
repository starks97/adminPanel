import { Test, TestingModule } from '@nestjs/testing';
import { PassHasherService } from './pass-hasher.service';
import * as bcrypt from 'bcryptjs';

describe('PassHasherService', () => {
  let service: PassHasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PassHasherService],
    }).compile();

    service = module.get<PassHasherService>(PassHasherService);
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const password = 'password';

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedpassword'));

      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toEqual('hashedpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });
  });

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const isMatch = await service.comparePassword(password, hashedPassword);

      expect(isMatch).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });

    it('should return false if passwords do not match', async () => {
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const isMatch = await service.comparePassword('wrongpassword', hashedPassword);

      expect(isMatch).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', hashedPassword);
    });
  });
});
