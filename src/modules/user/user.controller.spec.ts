import { PassHasherService } from './pass-hasher/pass-hasher.service';
import { Test, TestingModule } from '@nestjs/testing';

import { CacheSystemModule } from './../cache-system/cache-system.module';
import { UserController } from './user.controller';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ForbiddenException, Session } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UserModule, PrismaModule, CacheSystemModule],
      controllers: [UserController],
      providers: [UserService, PassHasherService],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  describe('findAllUser', () => {
    it('should return an array of users', async () => {
      const result = [{ name: 'John Doe', email: 'johndoe@example.com' }];
      jest.spyOn(service, 'FindAllUsers').mockImplementation(async () => result);

      expect(await controller.findAllUser()).toBe(result);
    });
  });

  describe('findUserById', () => {
    it('should return an user', async () => {
      const result = {
        id: '1',
        name: 'John Doe',
        email: 'juan@juan.com',
        password: '',
        roleName: 'OWNER',
        createdAt: new Date(),
        updatedAt: new Date(),
        birthday: new Date(),
        lastName: 'Doe',
        bio: 'hell',
        image: '',
      };
      jest.spyOn(service, 'FindUserById').mockImplementation(async () => result);

      expect(await controller.findUserById('1')).toBe(result);
    });
  });

  describe('searchUser', () => {
    describe('searchUser', () => {
      it('should return 200 status code with user search results', () => {
        // Arrange
        const mockUserService = {
          FindUserByEmailorName: jest
            .fn()
            .mockReturnValue([{ name: 'John', email: 'john@example.com' }]),
        };
        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const controller = new UserController(mockUserService as any);

        // Act
        controller.searchUser('john', mockResponse as any);

        // Assert
        expect(mockUserService.FindUserByEmailorName).toHaveBeenCalledWith('john');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([
          { name: 'John', email: 'john@example.com' },
        ]);
      });

      it('should throw ForbiddenException if user is not found', () => {
        // Arrange
        const mockUserService = {
          FindUserByEmailorName: jest.fn().mockReturnValue(null),
        };
        const mockResponse = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const controller = new UserController(mockUserService as any);

        // Act & Assert
        expect(() => controller.searchUser('nonexistent', mockResponse as any)).toThrow(
          ForbiddenException,
        );
      });
    });
  });

  describe('deleteUser', () => {
    it('should return a response with status 200', async () => {
      const mockUserService = {
        DeleteUser: jest.fn().mockReturnValue(true),
      };
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const controller = new UserController(mockUserService as any);

      controller.removeUser('1234', mockResponse as any);

      expect(mockUserService.DeleteUser).toHaveBeenCalledWith('1234');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'user_deleted' });
    });
  });
  it('should throw ForbiddenException if user was not deleted', () => {
    const mockUserService = {
      DeleteUser: jest.fn().mockReturnValue(false),
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const controller = new UserController(mockUserService as any);

    expect(() => controller.removeUser('1234', mockResponse as any)).toThrow(ForbiddenException);
  });
});
