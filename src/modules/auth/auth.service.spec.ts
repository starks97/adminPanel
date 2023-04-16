import { ForbiddenException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { CacheSystemModule } from './../cache-system/cache-system.module';
import { PassHasherModule } from './../user/pass-hasher/pass-hasher.module';
import { PassHasherService } from './../user/pass-hasher/pass-hasher.service';
import { UserModule } from './../user/user.module';
import { AuthService } from './auth.service';
import { LoginStatus, RegistrationStatus } from './interfaces';
import { SessionModule } from './session/session.module';
import { CacheSystemService } from '../cache-system/cache-system.service';

import { PrismaModule } from '../../../prisma/prisma.module';
import { CreateUserDto, LoginUserDto } from '../user/dto';
import { UserService } from '../user/user.service';
import { SessionManagerService } from './session/session.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;
  let jwtService: JwtService;

  const createUserDto: CreateUserDto = {
    name: 'John',
    email: 'jhon@jhon.com',
    password: 'password',
  };

  const loginUserDto: LoginUserDto = {
    email: 'johndoe@example.com',
    password: 'password',
  };

  const user = {
    id: '1',
    name: 'Jhon',
    lastName: 'Doee',
    email: 'example@example.com',
    password: 'password',
    bio: 'Hello, I am John Doe',
    image: 'https://example.com/image.png',
    birthday: new Date(),
    roleName: 'OWNER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const tokens = {
    authToken: 'authToken',
    refreshToken: 'refreshToken',
  };

  const jwtPayload = {
    id: user.id,
    email: user.email,
  };

  const session = {
    id: '1',
    userId: user.id,
    token: tokens.refreshToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const loginStatus: LoginStatus = {
    success: true,
    message: 'user_logged_in',
    data: {
      access_token: tokens.authToken,
      refresh_token: tokens.refreshToken,
      rest: {
        name: user.name,
        email: user.email,
        roleName: user.roleName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastName: user.lastName,
        bio: user.bio,
        image: user.image,
        birthday: user.birthday,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        UserModule,
        JwtModule.register({
          secret: process.env.SECRET_JWT_KEY as string,
        }),
        ConfigModule,
        SessionModule,
        CacheSystemModule,
        PassHasherModule,
      ],
      providers: [
        AuthService,
        UserService,
        JwtService,
        PrismaService,
        CacheSystemService,
        PassHasherService,

        SessionManagerService,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .overrideProvider(CacheSystemService)
      .useValue(mockDeep<CacheSystemService>())

      .compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );
  });

  describe('SignUp', () => {
    it('should create a new user and return a success message and user data', async () => {
      prismaMock.user.create.mockResolvedValueOnce(user);

      const RegistrationStatus: RegistrationStatus = {
        success: true,
        message: 'user_created',
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          roleName: user.roleName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      };

      jest.spyOn(service, 'SignUp').mockImplementation(() => Promise.resolve(RegistrationStatus));

      const result = await service.SignUp(createUserDto);

      expect(result).toEqual(RegistrationStatus);

      expect(service.SignUp).toBeCalledTimes(1);

      expect(service.SignUp).toBeCalledWith(createUserDto);
    });

    it('should throw a ForbiddenException if the user is not created', async () => {
      prismaMock.user.create.mockResolvedValueOnce(null);

      await expect(service.SignUp(createUserDto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('SignIn', () => {
    it('should return a success message and user data', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(user);

      jest.spyOn(service, 'SignIn').mockImplementation(() => Promise.resolve(loginStatus));

      const result = await service.SignIn(loginUserDto);

      expect(result).toEqual(loginStatus);

      expect(service.SignIn).toBeCalledTimes(1);

      expect(service.SignIn).toBeCalledWith(loginUserDto);
    });

    it('should throw a ForbiddenException if the user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.SignIn(loginUserDto)).rejects.toThrowError('user_not_found');
    });

    it('should create a new session and return a success message and user data', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      prismaMock.session.create.mockResolvedValueOnce(session);

      jest.spyOn(service, 'SignIn').mockImplementation(() => Promise.resolve(loginStatus));

      const result = await service.SignIn(loginUserDto);

      expect(result).toEqual(loginStatus);

      expect(service.SignIn).toBeCalledTimes(1);

      expect(service.SignIn).toBeCalledWith(loginUserDto);
    });
  });

  describe('RefreshToken', () => {
    it('should check refresh token in DB, return the token', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(user);
      prismaMock.session.findUnique.mockResolvedValueOnce(session);
      prismaMock.session.update.mockResolvedValueOnce(session);

      jest
        .spyOn(service, 'refreshToken')
        .mockImplementation(() => Promise.resolve(tokens.refreshToken));

      const result = await service.refreshToken(user.id, tokens.refreshToken);

      expect(result).toEqual(tokens.refreshToken);

      expect(service.refreshToken).toBeCalledTimes(1);

      expect(service.refreshToken).toBeCalledWith(user.id, tokens.refreshToken);
    });
  });

  describe('delete user session', () => {
    it('should delete user session', async () => {
      prismaMock.session.delete.mockResolvedValueOnce(session);

      jest.spyOn(service, 'deleteUserSession').mockImplementation(() => Promise.resolve(session));

      const result = await service.deleteUserSession(user.id);

      expect(result).toEqual(session);

      expect(service.deleteUserSession).toBeCalledTimes(1);

      expect(service.deleteUserSession).toBeCalledWith(user.id);
    });
  });

  describe('decode token', () => {
    it('should decode token', async () => {
      const token = await jwtService.signAsync({ id: user.id, email: user.email });

      tokens.authToken = token;

      const decoded = jwtService.decode(token);
      expect(decoded).toBeDefined();

      jest.spyOn(service, '_decodeToken').mockImplementation(() =>
        Promise.resolve({
          id: user.id,
          email: user.email,
        }),
      );

      const result = await service._decodeToken(tokens.authToken);

      expect(result).toEqual({
        id: user.id,
        email: user.email,
      });

      expect(service._decodeToken).toBeCalledWith(tokens.authToken);
    });
  });

  describe('create token', () => {
    it('should create auth and refresh token', async () => {
      jwtService.signAsync({ id: user.id, name: user.name, email: user.email }).then(token => {
        tokens.authToken = token;
      });

      jwtService.signAsync({ id: user.id, email: user.email }).then(token => {
        tokens.refreshToken = token;
      });

      jest.spyOn(service, '_createTokens').mockImplementation(() => Promise.resolve(tokens));

      const result = await service._createTokens(jwtPayload);

      expect(result).toEqual(tokens);

      expect(service._createTokens).toBeCalledWith(jwtPayload);
    });
  });
});
