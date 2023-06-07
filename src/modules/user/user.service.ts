import { CustomErrorException, errorCases, UserErrorHandler } from './../utils/handlerError';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { CreateUserDto, LoginUserDto, ProfileUserDto, UpdateUserDto } from './dto';
import { UpdateUserPasswordDto } from './dto/updatePass-user.dto';
import { PassHasherService } from './pass-hasher/pass-hasher.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheSystemService } from '../cache-system/cache-system.service';
import { PrismaMethods } from 'prisma/context';
import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';

/**
 * # User Service
 *
 * ## Description
 *
 * This is a **TypeScript** class that provides methods to create, read, update, and delete user
 * data. It takes three dependencies as arguments: **PrismaService**, **CacheSystemService**, and
 * **PassHasherService**.
 *
 * ## Methods
 *
 * - CreateUser
 * - UpdateUser
 * - DeleteUser
 * - FindByLogin
 * - FindUserById
 *
 * ## Constructor
 *
 * The constructor initializes the **UserService** instance with the following dependencies:
 *
 * - **prisma**(**Prismaservice**): A service that provides access to the Prisma ORM for database
 *   operations.
 * - **cache**(**CacheSystemService**): A service that provides methods for caching data in a store.
 * - **passwordHasher**(**PassHasherService**): A service that provides methods for hashing and
 *
 * ## Usage
 *
 * @module User
 * @version 1.0.0
 * @category User
 * @example
 *   ```typescript
 *   import { Injectable } from '@nestjs/common';
 *   import { PrismaService } from '../../../prisma/prisma.service';
 *   import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
 *   import { UpdateUserPasswordDto } from './dto/updatePass-user.dto';
 *   import { PassHasherService } from './pass-hasher/pass-hasher.service';
 *   import { CacheSystemService } from '../cache-system/cache-system.service';
 *   ```
 *
 *   ## Notes
 *
 *   - The **CacheSystemService** class is used to cache data in a store.
 *   - The **PassHasherService** class is used to hash and compare passwords.
 *   - The **PrismaService** class is used to interact with the database.
 *   - The **CreateUserDto** class is used to validate the data passed to the **CreateUser** method.
 *   - The **LoginUserDto** class is used to validate the data passed to the **FindByLogin** method.
 *   - The **UpdateUserDto** class is used to validate the data passed to the **UpdateUser** method.
 *   - The **UpdateUserPasswordDto** class is used to validate the data passed to the
 *   **UpdateUserPassword** method.
 *   - The **User** interface is used to define the structure of the data returned by the
 *   **FindUserById** method.
 *   - The **CreateUser** method is used to create a new user.
 *   - The **UpdateUser** method is used to update a user's data.
 *   - The **DeleteUser** method is used to delete a user.
 *   - The **FindByLogin** method is used to find a user by their email address.
 *   - The **FindUserById** method is used to find a user by their id.
 *   - The **UpdateUserPassword** method is used to update a user's password.
 *
 * @class
 * @param {PrismaService} prisma - Prisma Service
 * @param {CacheSystemService} cache - Cache System Service
 * @param {PassHasherService} passwordHasher - Password Hasher Service
 * @returns {UserService} - User Service
 * @subcategory Service
 * @classdesc User Service
 *
 * ## Links
 * @see {@link CreateUserDto}
 * @see {@link LoginUserDto}
 * @see {@link UpdateUserDto}
 * @see {@link UpdateUserPasswordDto}
 * @see {@link PassHasherService}
 * @see {@link PrismaService}
 * @see {@link CacheSystemService}
 * @see {@link User}
 * @see {@link createUser}
 * @see {@link DeleteUser}
 * @see {@link FindByLogin}
 * @see {@link FindUserById}
 * @see {@link FindUserByEmailorName}
 * @see {@link FindAllUsers}
 * @see {@link findUserByEmail}
 * @see {@link UpdateUserPassword}
 */
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly passwordHasher: PassHasherService,
    private readonly cloud: CloudinarySystemService,
  ) {
    this.cache._configModel('user', {
      include: {
        sessions: true,
        role: true,
      },
    });
  }

  /**
   * # Method: CreateUser
   *
   * ## Description
   *
   * This method is used to create a new user. It takes a **CreateUserDto** object as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const createUserDto: CreateUserDto = {
   *   name: 'John Doe',
   *   email: 'johndoe@example.com',
   *   password: 'password123',
   *   };
   *
   *   try {
   *   const newUser = await userService.createUser(createUserDto);
   *   console.log(`Created user with id ${newUser.id}`);
   *   } catch (error) {
   *   console.error(`Failed to create user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {CreateUserDto} createUser - Create User DTO
   *
   *   ## Links
   * @see {@link CreateUserDto}
   */

  async createUser(createUser: CreateUserDto) {
    try {
      const { email, name, password } = createUser;

      // // check if the user exists in the db
      const userInDb = await this.prisma.user.findFirst({
        where: { email },
      });

      if (userInDb) {
        throw new HttpException('user_already_exist', HttpStatus.CONFLICT);
      }

      const hashedPassword = await this.passwordHasher.hashPassword(password);

      const user = await this.prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: {
            connectOrCreate: {
              where: {
                name: 'PUBLIC',
              },
              create: {
                name: 'PUBLIC',
              },
            },
          },
        },
        include: {
          sessions: true,
          role: true,
        },
      });

      if (!user)
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_CREATED,
          errorType: 'User',
        });

      await this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'all_users',
        exclude: ['password'],
      });

      return user;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('user', e, errorCases.USER_NOT_CREATED);
      }
      throw e;
    }
  }

  /**
   * # Method: FindByLogin
   *
   * ## Description
   *
   * This method is used to find a user by their email address and password. It takes a
   * **LoginUserDto** object as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const loginUserDto: LoginUserDto = {
   *   email: 'johndoe@example.com',
   *   password: 'password123',
   *   };
   *
   *   try {
   *   const logUser = await userService.FindByLogin(loginUserDto);
   *   console.log(`Found user with id ${logUser.id}`);
   *   } catch (error) {
   *   console.error(`Failed to find user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {LoginUserDto} loginUser - Login User DTO
   *
   *   ## Links
   * @see {@link LoginUserDto}
   */
  async FindByLogin({ email, password }: LoginUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          sessions: true,
          role: true,
        },
      });

      if (!user) {
        throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
      }

      const isVerifiedPassword = await this.passwordHasher.comparePassword(password, user.password);

      if (!isVerifiedPassword) {
        throw new HttpException('password_not_match', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('user', e, errorCases.USER_NOT_FOUND);
      }
      throw e;
    }
  }

  /**
   * # Method: FindUserById
   *
   * ## Description
   *
   * This method is used to find a user by their id. It takes a string as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const id = '123456789';
   *   try {
   *   const user = await userService.FindUserById(id);
   *   console.log(`Found user with id ${user.id}`);
   *   } catch (error) {
   *   console.error(`Failed to find user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} id - User Id
   */

  async FindUserById(id: string): Promise<User | null> {
    const dataCache = await this.cache.get('user:' + id);

    if (dataCache) return dataCache;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          sessions: true,
          role: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      delete user.password;

      await this.cache.set('user:' + id, user, 60);

      return user;
    } catch (e) {
      console.error(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('user', e, errorCases.USER_NOT_FOUND);
      }
    }
  }

  /**
   * # Method: FindUserByEmailorName
   *
   * ## Description
   *
   * This method is used to find a user by their email or name. It takes a string as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const q = 'something';
   *   try {
   *   const user = await userService.FindUserByEmailorName(q);
   *   console.log(`Found user with id ${user.id}`);
   *   } catch (error) {
   *   console.error(`Failed to find user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} q - Query string
   *
   *   ## Exceptions
   * @throws {HttpException} User_not_found - User not found
   */

  async FindUserByName(q: string, offset: number, limit: number) {
    const dataCache = await this.cache.get('all_users');

    if (dataCache) return dataCache;
    try {
      const user = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: q,
              },
            },
          ],
        },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          sessions: true,
        },
      });

      if (!user) {
        throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
      }

      const data = { users: user, total: user.length };

      await this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'all_users',
        exclude: ['password'],
      });

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('user', e, errorCases.USER_NOT_FOUND);
      }

      throw e;
    }
  }

  /**
   * # Method: FindAllUsers
   *
   * ## Description
   *
   * This method is used to find all users. It takes no arguments.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   try {
   *   const users = await userService.FindAllUsers();
   *   console.log(`Found ${users.length} users`);
   *   } catch (error) {
   *   console.error(`Failed to find users: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Returns
   *
   * @returns {Promise<{users: User[] | total: number}>} - Array of users and total number of users
   */

  async FindAllUsers(
    offset: number,
    limit: number,
  ): Promise<{ users: User[]; total: number } | []> {
    const dataCache = await this.cache.get('all_users');

    if (dataCache) return dataCache;
    try {
      const users = await this.prisma.user.findMany({
        skip: offset,
        take: limit,
        include: {
          sessions: true,
          role: true,
        },
      });

      users.forEach(user => {
        delete user.password;
      });

      const data = { users, total: users.length };

      await this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'all_users',
        exclude: ['password'],
      });

      return data || [];
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('users', e);
      }
    }
  }

  /**
   * # Method: AssignRoleToUser
   *
   * ## Description
   *
   * This method is used to assign a role to a user. It takes a string and an object as arguments.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const id = '123456789';
   *   const roleName = 'ADMIN';
   *   try {
   *   const user = await userService.AssignRoleToUser(id, roleName);
   *   console.log(`Assigned role ${roleName} to user with id ${user.id}`);
   *   } catch (error) {
   *   console.error(`Failed to assign role to user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} id - User Id
   * @param {string} roleName - Role Name
   *
   *   ## Returns
   * @returns {Promise<User>} - User
   *
   *   ## Exceptions
   * @throws {HttpException} User_not_found - User not found
   * @throws {HttpException} Role_not_found - Role not found
   *
   *   ## Links
   * @see {@link FindUserById}
   * @see {@link FindRoleByName}
   * @see {@link UpdateUser}
   * @see {@link CacheSystemService}
   * @see {@link User}
   */

  async AssignRoleToUser(userId: string, roleName: string) {
    try {
      return await this.prisma.$transaction(async ctx => {
        const user = await ctx.user.findUnique({
          where: {
            id: userId,
          },
          include: {
            role: true,
          },
        });

        if (!user) throw new UserErrorHandler('user', null, errorCases.USER_NOT_FOUND);

        const role = await ctx.role.findUnique({
          where: {
            name: roleName,
          },
        });

        if (!role)
          throw new HttpException(
            `role ${roleName} was not founded correctly`,
            HttpStatus.NOT_FOUND,
          );

        const updatedUser = await ctx.user.update({
          where: {
            id: userId,
          },
          data: {
            role: {
              connect: {
                name: role.name,
              },
            },
          },
          include: {
            role: true,
          },
        });
        await this.cache.cacheState<User>({
          model: 'user',
          storeKey: 'all_users',
          exclude: ['password'],
        });

        return updatedUser;
      });
    } catch (e) {
      console.error(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_FOUND || errorCases.ROLE_NOT_FOUND,
          value: userId || roleName,
          errorType: 'User',
        });
      }
    }
  }

  /**
   * # Method: DeleteUser
   *
   * ## Description
   *
   * This method is used to delete a user. It takes a string as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const id = '123456789';
   *   try {
   *   const user = await userService.DeleteUser(id);
   *   console.log(`Deleted user with id ${user.id}`);
   *   } catch (error) {
   *   console.error(`Failed to delete user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} id - User Id
   *
   *   ## Returns
   * @returns {User} - User deleted
   *
   *   ## Exceptions
   * @throws {HttpException} User_not_deleted - User not deleted
   */

  async DeleteUser(id: string) {
    try {
      const deletedUser = await this.prisma.user.delete({
        where: { id },
      });

      if (!deletedUser)
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_DELETED,
          value: id,
          errorType: 'User',
        });

      await this.cache.cacheState<User>({ model: 'user', storeKey: 'all_users' });

      return deletedUser;
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_DELETED,
          value: id,
          errorType: 'User',
        });
      }
    }
  }

  /**
   * # Method: UpdateUserPassword
   *
   * ## Description
   *
   * This method is used to update a user password. It takes a string and an object as arguments.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const id = '123456789';
   *   const pass = { password: 'newpassword' };
   *   try {
   *   const user = await userService.UpdateUserPassword(id, pass);
   *   console.log(`Updated user password with id ${user.id}`);
   *   } catch (error) {
   *   console.error(`Failed to update user password: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} id - User Id
   * @param {UpdateUserPasswordDto} pass - User password
   *
   *   ## Returns
   * @returns {Promise<User>} - User
   *
   *   ## Exceptions
   * @throws {HttpException} User_not_updated - User not updated
   */

  async UpdateUserPassword(id: string, pass: UpdateUserPasswordDto) {
    try {
      const newUserPassword = await this.prisma.user.update({
        where: { id },
        data: {
          password: pass
            ? await this.passwordHasher.hashPassword(pass?.password as string)
            : undefined,
          updatedAt: new Date(),
        },
        include: {
          sessions: true,
        },
      });

      if (!newUserPassword)
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_UPDATED,
          value: id,
          errorType: 'User',
        });

      await this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'all_users',
        exclude: ['password'],
      });

      return newUserPassword;
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_UPDATED,
          value: id,
          errorType: 'User',
        });
      }
    }
  }

  /**
   * # Method: findUserByEmail
   *
   * ## Description
   *
   * This method is used to find a user by email. It takes a string as an argument.
   *
   * ## Usage
   *
   * @example
   *   ```typescript
   *   const email = 'example@example.com';
   *   try {
   *   const user = await userService.findUserByEmail(email);
   *   console.log(`Found user with email ${user.email}`);
   *   } catch (error) {
   *   console.error(`Failed to find user: ${error.message}`);
   *   }
   *   ```
   *
   *   ## Params
   *
   * @param {string} email - User email
   *
   *   ## Returns
   * @returns {User | null} - User or null
   *
   *   ## Exceptions
   * @throws {HttpException} User_not_found - User not found *
   */

  async findUserByEmail(email: string): Promise<User | null> {
    const dataCache = await this.cache.get('user:' + email);

    if (dataCache) return dataCache;
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user)
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_FOUND,
          value: email,
          errorType: 'User',
        });

      delete user.password;

      await this.cache.set('user:' + email, user, 60);

      return user;
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_FOUND,
          value: email,
          errorType: 'User',
        });
      }
      throw e;
    }
  }

  async createUserProfile(profile: ProfileUserDto, id: string, file?: Express.Multer.File) {
    try {
      const cloud = !file ? undefined : await this.cloud.uploadSingle(file);

      const { bio, birthday, lastName } = profile;

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          bio,
          birthday,
          lastName,
          image: cloud.url,
        },
      });

      if (!user)
        throw new CustomErrorException({
          errorCase: 'User_profile_not_created',
          value: id,
          errorType: 'User',
        });

      return user;
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: 'User_profile_not_created',
          value: id,
          errorType: 'User',
        });
      }
    }
  }
}
