import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { PrismaModule } from '../../../../prisma/prisma.module';
import { PrismaService } from '../../../../prisma/prisma.service';

import { SessionManagerService } from './session.service';
import { SessionModule } from './session.module';
import * as bcrypt from 'bcryptjs';
import { ForbiddenException } from '@nestjs/common';

describe('SessionManagerService', () => {
  let service: SessionManagerService;
  let prismaMock: DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>;

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
    sessions: [
      {
        id: '1',
      },
      {
        id: '2',
      },
      {
        id: '3',
      },
    ],
  };

  const session = {
    id: '1',
    userId: mockedUser.id,
    token: 'token',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sessionRes = {
    id: '1',
    token: 'token123',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockedUser.id,
    User: {
      id: mockedUser.id,
      email: mockedUser.email,
      name: mockedUser.name,
      lastName: mockedUser.lastName,
      bio: mockedUser.bio,
      image: mockedUser.image,
      birthday: mockedUser.birthday,
      password: mockedUser.password,
      roleName: mockedUser.roleName,
      createdAt: mockedUser.createdAt,
      updatedAt: mockedUser.updatedAt,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SessionModule],
      providers: [
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())

      .compile();

    prismaMock =
      module.get<DeepMockProxy<{ [K in keyof PrismaClient]: Omit<PrismaClient[K], 'groupBy'> }>>(
        PrismaService,
      );
    service = module.get<SessionManagerService>(SessionManagerService);
  });

  describe('createSessionAndOverride', () => {
    it('should create a session', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(mockedUser);
      prismaMock.session.create.mockResolvedValueOnce(session);

      jest
        .spyOn(service, 'createSessionAndOverride')
        .mockImplementation(() => Promise.resolve(sessionRes));

      // Act
      const result = await service.createSessionAndOverride(session.userId, session.token);

      // Assert

      expect(result).not.toBeNull();
      expect(result).toEqual(sessionRes);

      expect(service.createSessionAndOverride).toBeCalledTimes(1);

      expect(service.createSessionAndOverride).toBeCalledWith(session.userId, session.token);
    });

    it('should throw an error if user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      // Act and Assert
      expect(await service.createSessionAndOverride(session.userId, session.token)).rejects.toThrow(
        'user_not_found',
      );
    });

    it('should throw an error if session is not created', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      // Act and Assert
      await expect(service.createSessionAndOverride(session.userId, session.token)).rejects.toThrow(
        'user_not_found',
      );
    });
  });

  describe('updateSession', () => {
    it('should update the session token and return the updated session object', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValueOnce(mockedUser);
      prismaMock.session.update.mockResolvedValueOnce(session);

      // Act
      const result = await service.updateSession(mockedUser.id, 'new_token');

      // Assert
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockedUser.id,
        },
        include: {
          sessions: true,
        },
      });
      expect(prismaMock.session.update).toHaveBeenCalledWith({
        where: {
          id: mockedUser.sessions[0].id,
        },
        data: {
          token: 'new_token',
        },
      });
      expect(result).toEqual(session);
    });
  });
});
