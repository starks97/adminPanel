import { PassHasherService } from './pass-hasher/pass-hasher.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';
import { UpdateUserPasswordDto } from './dto/updatePass-user.dto';
import { CacheSystemService } from '../cache-system/cache-system.service';
import { PrismaService } from '../../../prisma/prisma.service';
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly passwordHasher: PassHasherService,
  ) {
    this.cache._configModel('user', {
      include: {
        sessions: true,
        role: true,
      },
    });
  }

  async createUser(createUser: CreateUserDto): Promise<User | null> {
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

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return user;
  }
  async FindByLogin({ email, password }: LoginUserDto): Promise<User | null> {
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
  }

  async FindUserById(id: string): Promise<User | null> {
    const dataCache = await this.cache.get('user:' + id);

    if (dataCache) {
      return dataCache;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          sessions: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }

      delete user.password;

      await this.cache.set('user:' + id, user, 60);

      return user as User;
    } catch (error) {
      console.error(`Error finding user with id ${id}:`, error);
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }
  }

  async FindUserByEmailorName(q: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              contains: q,
            },
          },
          {
            name: {
              contains: q,
            },
          },
        ],
      },

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

    return user;
  }

  async FindAllUsers() {
    const dataCache = await this.cache.get('all_users');

    if (dataCache) return dataCache;

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        sessions: true,
        role: true,
      },
      skip: 0,
      take: 10,
    });

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return users || [];
  }

  /*async UpdateDataUser(id: string, data: UpdateUserDto): Promise<User | null> {
    const { name, role } = data;

    const newDataUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: name,
        role: role,
        updatedAt: new Date(),
      },
      include: {
        sessions: true,
      },
    });

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return newDataUser;
  }*/

  async DeleteUser(id: string) {
    this.FindUserById(id);
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    if (!deletedUser) throw new HttpException('user_not_deleted', HttpStatus.NOT_FOUND);

    await this.cache.cacheState<User>({ model: 'user', storeKey: 'all_users' });

    return deletedUser;
  }

  async UpdateUserPassword(id: string, pass: UpdateUserPasswordDto) {
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

    if (!newUserPassword) throw new HttpException('user_not_updated', HttpStatus.NOT_FOUND);

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return newUserPassword;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const dataCache = await this.cache.get('user:' + email);

    if (dataCache) {
      return dataCache;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);

    delete user.password;

    await this.cache.set('user:' + email, user, 60);

    return user;
  }
}
