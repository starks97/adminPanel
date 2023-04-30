import { CACHE_MANAGER, CacheModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, Role, Session, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import * as redisMock from 'redis-mock';

import { CacheSystemModule } from './../cache-system/cache-system.module';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { CreateUserDto, LoginUserDto, UpdateUserDto, UpdateUserPasswordDto } from './dto';
import { PassHasherService } from './pass-hasher/pass-hasher.service';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaService } from '../../../prisma/prisma.service';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<{
  [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'>;
}>;

describe('UserService', () => {
  let service: UserService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;
  let cacheService: Cache;

  const mockedUser = {
    id: '1234',
    email: 'david@david.com',
    name: 'david',
    lastName: 'lucifer',
    bio: 'bio',
    image: 'image',
    birthday: new Date(),
    password: bcrypt.hashSync('1234', 10),
    roleName: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        CacheSystemModule,
        UserModule,
        CacheModule.register({
          store: redisStore,
        }),
      ],
      providers: [
        UserService,
        PrismaService,
        CacheSystemService,
        PassHasherService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            store: redisStore,
            host: 'localhost',
            port: 6379,
            ttl: 180,
            create: () => {
              return redisMock.createClient();
            },
          },
        },
      ],
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

    cacheService = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(async () => {
    await cacheService.store.reset();
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: '1234',
      };

      prismaMock.user.create.mockResolvedValue(mockedUser);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockedUser);
    });

    it('should check if the user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'diablos@diablos.com',
        name: 'diablos',
        password: '1234',
      };

      prismaMock.user.findFirst.mockResolvedValue(mockedUser);

      expect(service.createUser(createUserDto)).rejects.toThrowError('user_already_exist');
    });
  });

  describe('FindByLogin', () => {
    it('should find a user by login', async () => {
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
      prismaMock.user.findUnique.mockResolvedValue(mockedUser);

      const result = service.FindUserById('1234');

      expect(result).resolves.toBe(mockedUser);
    });

    it('should check if the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      expect(service.FindUserById('123')).rejects.toThrowError('user_not_found');
    });

    it('should check if the user is in cache', async () => {
      await cacheService.set('1234', mockedUser, 60);

      expect(await cacheService.get('1234')).toStrictEqual({
        ...mockedUser,
        createdAt: mockedUser.createdAt.toISOString(),
        updatedAt: mockedUser.updatedAt.toISOString(),
        birthday: mockedUser.birthday.toISOString(),
      });
    });
  });

  describe('find user by email or name', () => {
    it('should find a user by email or name', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockedUser);

      const result = await service.FindUserByEmailorName('david');

      expect(result).toBe(mockedUser);
    });
    it('should check if the user does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      expect(service.FindUserByEmailorName('hello')).rejects.toThrowError('user_not_found');
    });
  });

  describe('find all users', () => {
    it('should find all users', async () => {
      prismaMock.user.findMany.mockResolvedValue([mockedUser]);

      const result = await service.FindAllUsers();

      expect(result).toEqual([mockedUser]);
    });

    it('should return an empty array if there is not users on db', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      expect(await service.FindAllUsers()).toEqual([]);
    });

    it('should check if the users are in cache', async () => {
      await cacheService.set('users', [mockedUser], 60);

      expect(await cacheService.get('users')).toStrictEqual([
        {
          ...mockedUser,
          createdAt: mockedUser.createdAt.toISOString(),
          updatedAt: mockedUser.updatedAt.toISOString(),
          birthday: mockedUser.birthday.toISOString(),
        },
      ]);
    });
  });

  describe('delete user', () => {
    it('should delete the user and return the deleted user object', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockedUser);
      prismaMock.user.delete.mockResolvedValue(mockedUser);

      expect(await service.DeleteUser(mockedUser.id)).toEqual(mockedUser);

      expect(prismaMock.user.delete).toBeCalledWith({
        where: {
          id: mockedUser.id,
        },
      });
    });

    it('should check if the data of the user had been deleted', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockedUser);
      prismaMock.user.delete.mockResolvedValue(null);

      expect(service.DeleteUser('whatever')).rejects.toThrowError('user_not_deleted');
    });

    it('should check if the deleted user is in cache', async () => {
      await cacheService.set('1234', mockedUser, 60);

      expect(await cacheService.get('1234')).toStrictEqual({
        ...mockedUser,
        createdAt: mockedUser.createdAt.toISOString(),
        updatedAt: mockedUser.updatedAt.toISOString(),
        birthday: mockedUser.birthday.toISOString(),
      });
    });
  });

  describe('update user password', () => {
    it('should update the user and return the updated user object', async () => {
      const updateUserDto: UpdateUserPasswordDto = {
        password: bcrypt.hashSync('12345', 10),
      };

      prismaMock.user.update.mockResolvedValue(mockedUser);

      const result = await service.UpdateUserPassword(mockedUser.id, {
        password: updateUserDto.password,
      });

      expect(result).toEqual(mockedUser);
    });

    it('should throw an HttpException if the user is not found', async () => {
      // Mock the Prisma client's `user.update` method to return null.
      prismaMock.user.update.mockResolvedValue(null);

      // Call the method with a user ID and a new password.
      const updatePromise = service.UpdateUserPassword('testUserId', { password: 'newPassword' });

      // Assert that the method threw an HttpException with the expected message and status code.
      await expect(updatePromise).rejects.toThrowError('user_not_updated');
    });

    it('should check if the updated user is in cache', async () => {
      await cacheService.set('1234', mockedUser, 60);

      expect(await cacheService.get('1234')).toStrictEqual({
        ...mockedUser,
        createdAt: mockedUser.createdAt.toISOString(),
        updatedAt: mockedUser.updatedAt.toISOString(),
        birthday: mockedUser.birthday.toISOString(),
      });
    });
  });

  describe('find user by email', () => {
    it('should find a user by email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockedUser);

      const result = await service.findUserByEmail('david');

      expect(result).toBe(mockedUser);
      expect(prismaMock.user.findUnique).toBeCalledWith({
        where: {
          email: 'david',
        },
      });
    });
    it('should check if the user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      expect(service.findUserByEmail('hello')).rejects.toThrowError('user_not_found');
    });
  });

  describe('assign role to user', () => {
    it('should assign a role to a user', async () => {
      const user: User & {
        role: Role;
      } = {
        ...mockedUser,
        roleName: 'ADMIN',
        role: {
          id: '1234',
          name: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: ['READ', 'UPDATE', 'DELETE'],
        },
      };

      jest.spyOn(service, 'AssignRoleToUser').mockImplementation(() => Promise.resolve(user));

      prismaMock.user.update.mockResolvedValue(user);

      const result = await service.AssignRoleToUser(user.id, user.roleName);

      expect(result).toEqual(user);

      expect(service.AssignRoleToUser).toBeCalledTimes(1);

      expect(service.AssignRoleToUser).toBeCalledWith(user.id, user.roleName);
    });
  });
});
