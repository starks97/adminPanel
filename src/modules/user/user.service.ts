import { CustomErrorException, errorCases, UserErrorHandler } from './../utils/handlerError';
import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import { CreateUserDto, LoginUserDto, ProfileUserDto } from './dto';
import { UpdateUserPasswordDto } from './dto/updatePass-user.dto';
import { PassHasherService } from './pass-hasher/pass-hasher.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheSystemService } from '../cache-system/cache-system.service';
import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';

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
   * Create a new user.
   *
   * @param createUserDto - The data for creating a new user.
   * @returns A promise that resolves to the created user.
   * @throws HttpException if a user with the same email already exists.
   * @throws CustomErrorException if the user cannot be created.
   * @throws UserErrorHandler if an error occurs during the creation process.
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

      this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'users',
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
   * Find a user by login credentials (email and password).
   *
   * @param loginUserDto - The login credentials (email and password).
   * @returns A promise that resolves to the found user.
   * @throws HttpException if the user is not found or the password is incorrect.
   * @throws UserErrorHandler if an error occurs during the retrieval process.
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

      if (!isVerifiedPassword)
        throw new CustomErrorException({
          errorCase: 'The password you provided not match, please provide the correct password',
          errorType: 'User',
          value: email,
        });

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
   * Find a user by ID.
   *
   * @param id - The ID of the user.
   * @returns A promise that resolves to the found user.
   * @throws NotFoundException if the user is not found.
   * @throws UserErrorHandler if an error occurs during the retrieval process.
   */

  async FindUserById(id: string) {
    const dataCache = JSON.parse(await this.cache.get('user:' + id));

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

      this.cache.set('user:' + id, JSON.stringify(user), 60);

      return user;
    } catch (e) {
      console.error(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('user', e, errorCases.USER_NOT_FOUND);
      }
    }
  }

  /**
   * Find users by name with pagination.
   *
   * @param q - The search query.
   * @param offset - The number of items to skip.
   * @param limit - The maximum number of items to retrieve.
   * @returns A promise that resolves to an object containing the users and the total count.
   * @throws UserErrorHandler if an error occurs during the retrieval process.
   */

  async FindUserByName(q: string, offset: number, limit: number) {
    const dataCache = JSON.parse(await this.cache.get(`user:${q}:offset:${offset}:limit:${limit}`));

    if (dataCache) return { users: dataCache, total: dataCache.length };
    try {
      const user = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                startsWith: q,
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

      this.cache.set(`user:${q}:offset:${offset}:limit:${limit}`, JSON.stringify(user), 60);

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
   * Find all users with pagination.
   *
   * @param offset - The number of items to skip.
   * @param limit - The maximum number of items to retrieve.
   * @returns A promise that resolves to an object containing the users and the total count.
   * @throws UserErrorHandler if an error occurs during the retrieval process.
   */
  async FindAllUsers(offset: number, limit: number) {
    const cacheKey = `user:${offset}:${limit}`;
    const dataCache = await this.cache.cachePagination({
      limit,
      offset,
      storeKey: 'users',
      newKey: 'user',
    });

    if (dataCache) {
      return { users: dataCache, total: dataCache.length };
    }

    const dataWithoutCache = JSON.parse(await this.cache.get(cacheKey));

    if (dataWithoutCache) {
      return { users: dataWithoutCache, total: dataWithoutCache.length };
    }

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

      this.cache.set(`user:${offset}:${limit}`, JSON.stringify(users), 60);

      return data || [];
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new UserErrorHandler('users', e);
      }

      throw e;
    }
  }

  /**
   * Assign a role to a user.
   *
   * @param userId - The ID of the user.
   * @param roleName - The name of the role to assign.
   * @returns A promise that resolves to the updated user.
   * @throws CustomErrorException if the user or role is not found.
   */

  async AssignRoleToUser(userId: string, roleName: string) {
    try {
      const data = await this.prisma.$transaction(async ctx => {
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
            `The role {${roleName}} you just provided does not exist, please check the role list`,
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

        return updatedUser;
      });

      this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'users',
        exclude: ['password'],
      });

      return data;
    } catch (e) {
      console.error(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_FOUND || errorCases.ROLE_NOT_FOUND,
          value: userId || roleName,
          errorType: 'User',
        });
      }
      throw e;
    }
  }

  /**
   * Delete a user.
   *
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves to the deleted user.
   * @throws CustomErrorException if the user is not deleted.
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

      this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'users',
        exclude: ['password'],
      });

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
      throw e;
    }
  }

  /**
   * Update a user's password.
   *
   * @param id - The ID of the user.
   * @param pass - The updated password information.
   * @returns A promise that resolves to the updated user.
   * @throws UserErrorHandler if the user is not found.
   * @throws CustomErrorException if the provided old password is incorrect or if the user is not
   *   updated.
   */

  async UpdateUserPassword(id: string, pass: UpdateUserPasswordDto) {
    try {
      const { newPassword, oldPassword } = pass;

      const data = await this.prisma.$transaction(async ctx => {
        const user = await ctx.user.findUnique({
          where: { id },
          include: {
            sessions: true,
          },
        });

        if (!user) throw new UserErrorHandler('user', null, errorCases.USER_NOT_FOUND);

        const comparePass = await this.passwordHasher.comparePassword(oldPassword, user.password);

        if (!comparePass)
          throw new CustomErrorException({
            errorCase:
              'The password you provided is incorrect, please provide the correct password',
            errorType: 'User',
            value: id,
          });

        const updatedUser = await ctx.user.update({
          where: { id },
          data: {
            password: pass ? await this.passwordHasher.hashPassword(newPassword) : undefined,
            updatedAt: new Date(),
          },
          include: {
            sessions: true,
          },
        });

        if (!updatedUser)
          throw new CustomErrorException({
            errorCase: errorCases.USER_NOT_UPDATED,
            value: id,
            errorType: 'User',
          });

        return updatedUser;
      });

      this.cache.cacheState<User>({
        model: 'user',
        storeKey: 'users',
        exclude: ['password'],
      });

      return data;
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.USER_NOT_UPDATED,
          value: id,
          errorType: 'User',
        });
      }
      throw e;
    }
  }

  /**
   * Find a user by their email address.
   *
   * @param email - The email address of the user to find.
   * @returns A promise that resolves to the found user.
   * @throws CustomErrorException if the user is not found.
   */
  async findUserByEmail(email: string) {
    const dataCache = JSON.parse(await this.cache.get('user:' + email));

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

      this.cache.set('user:' + email, JSON.stringify(user), 60);

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
  /**
   * Create or update a user profile with the provided data.
   *
   * @param profile - The profile data to be updated or created.
   * @param id - The ID of the user associated with the profile.
   * @param file - Optional file to upload for the user's profile image.
   * @returns A promise that resolves to the updated or created user profile.
   * @throws CustomErrorException if the user profile is not created or updated.
   */
  async createUserProfile(profile: ProfileUserDto, id: string, file?: Express.Multer.File) {
    const cloud = !file ? undefined : await this.cloud.uploadSingle(file);
    try {
      const { bio, birthday, lastName, name } = profile;

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          bio,
          birthday,
          lastName,
          name,
          image: cloud && cloud.url ? cloud.url : undefined,
        },
      });

      if (!user)
        throw new CustomErrorException({
          errorCase: 'User_profile_not_created',
          value: id,
          errorType: 'User',
        });

      this.cache.cacheState({
        model: 'user',
        storeKey: 'users',
        exclude: ['password'],
      });
      return user;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: 'User_profile_not_created',
          value: id,
          errorType: 'User',
        });
      }
      throw e;
    }
  }
}
