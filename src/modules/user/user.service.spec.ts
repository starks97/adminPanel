import { CacheSystemService } from './../cache-system/cache-system.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

import { CacheSystemModule } from './../cache-system/cache-system.module';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto, LoginUserDto } from './dto';

import { PasswordHasher } from '../../utils';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<{
  [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'>;
}>;

describe('UserService', () => {
  let service: UserService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;
  let cacheService: DeepMockProxy<CacheSystemService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, CacheSystemModule, UserModule],
      providers: [UserService, PrismaService, CacheSystemService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .overrideProvider(CacheSystemService)
      .useValue(mockDeep<CacheSystemService>())
      .compile();

    service = module.get<UserService>(UserService);
    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );

    cacheService = module.get<DeepMockProxy<CacheSystemService>>(CacheSystemService);
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const hashedPassword = PasswordHasher.setHashPassword('1234');
      const mockedUser = {
        id: '1234',
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: hashedPassword,
        role: 'OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const createUserDto: CreateUserDto = {
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: '1234',
        role: 'OWNER',
      };

      prismaMock.user.create.mockResolvedValue(mockedUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockedUser);
    });

    it('should check if the user already exists', async () => {
      const hashedPassword = PasswordHasher.setHashPassword('1234');
      const mockedUser = {
        id: '1234',
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: hashedPassword,
        role: 'OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createUserDto: CreateUserDto = {
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: '1234',
        role: 'OWNER',
      };

      prismaMock.user.findFirst.mockResolvedValue(mockedUser);

      expect(service.createUser(createUserDto)).rejects.toThrowError('user_already_exist');
    });
  });

  describe('FindByLogin', () => {
    it('should find a user by login', async () => {
      const hashedPassword = PasswordHasher.setHashPassword('1234');
      const mockedUser = {
        id: '1234',
        email: 'escanor@escanor.com',
        name: 'escanor',
        password: hashedPassword,
        role: 'PUBLIC',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const loginUserDto: LoginUserDto = {
        email: 'escanor@escanor',
        password: '1234',
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser);

      const result = await service.FindByLogin(loginUserDto);

      expect(result).toEqual(mockedUser);
    });

    it('should check if the user does not exist', async () => {
      const loginUserDto: LoginUserDto = {
        email: 'escanor@escanor',
        password: '1234',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);

      expect(service.FindByLogin(loginUserDto)).rejects.toThrowError('user_not_found');
    });

    it('should check if the password is incorrect', async () => {
      const hashedPassword = PasswordHasher.setHashPassword('1234');
      const mockedUser = {
        id: '1234',
        email: 'escanor@escanor.com',
        name: '',
        password: hashedPassword,
        role: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser);

      const loginUserDto: LoginUserDto = {
        email: 'escanor@escanor',
        password: '123455434',
      };

      expect(service.FindByLogin(loginUserDto)).rejects.toThrowError('password_not_match');
    });
  });

  describe('FindById', () => {
    it('should find a user by id', async () => {
      const hashedPassword = PasswordHasher.setHashPassword('1234');
      const mockedUser = {
        id: '1234',
        email: '',
        name: '',
        password: hashedPassword,
        role: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockedUser);

      const spy = jest.spyOn(cacheService, 'set');

      const result = service.FindUserById('1234');

      expect(result).resolves.toBe(mockedUser);

      console.log(spy.mock.calls);
    });

    it('should check if the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      expect(service.FindUserById('123445')).rejects.toThrowError('user_not_found');
    });

    it('should check if the user is in the cache', async () => {
      const userInCache = {
        id: '1234',
        email: '',
        name: '',
        password: '',
        role: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      cacheService.get.mockResolvedValue(userInCache);

      expect(service.FindUserById('1234')).resolves.toEqual(userInCache);
    });
  });
});
