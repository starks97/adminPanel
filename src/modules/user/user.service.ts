import { CacheSystemService } from '../cache-system/cache-system.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import PasswordHasher from 'src/utils/passwordHasher';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheSystemService) {}

  async createUser(createUser: CreateUserDto): Promise<User | null> {
    //const dataCache = await this.cache.get('all_users');

    const { email, name, password, role } = createUser;

    // // check if the user exists in the db
    const userInDb = await this.prisma.user.findFirst({
      where: { email },
    });

    const hashedPassword = PasswordHasher.setHashPassword(password);

    if (userInDb) {
      throw new HttpException('user_already_exist', HttpStatus.CONFLICT);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'PUBLIC',
      },
    });

    /*if (dataCache) {
      await this.cache.set('all_users', [...dataCache, user]);
    }*/

    this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return user;
  }
  async FindByLogin({ email, password }: LoginUserDto): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }

    const isVerifiedPassword = PasswordHasher.compareHashPassword(password, user.password);

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

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }
    delete user.password;

    console.log('call from db');

    await this.cache.set('user:' + id, user, 60);

    return user as User;
  }

  async FindUserByEmailorName(q: string): Promise<User | null> {
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
      },
    });

    if (!user) {
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }

    return user as User;
  }

  async FindAllUsers(): Promise<User[] | null> {
    const dataCache = await this.cache.get('all_users');

    if (dataCache) return dataCache;

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: 0,
      take: 10,
    });

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return (users as User[]) || [];
  }

  async UpdateDataUser(id: string, data: UpdateUserDto): Promise<User | null> {
    //const cacheData = await this.cache.get('all_users');

    const { name, password, role } = data;

    const newDataUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: name,
        password: password ? PasswordHasher.setHashPassword(password) : undefined,
        role: role,
        updatedAt: new Date(),
      },
    });

    delete newDataUser.password;

    /*if (cacheData) {
      cacheData.find(user => {
        if (user.id === id) {
          user.name = name;
          user.role = role;

          return true;
        }
      });

      console.log('data from db');

      await this.cache.set('all_users', cacheData);
    }*/

    await this.cache.cacheState<User>({
      model: 'user',
      storeKey: 'all_users',
      exclude: ['password'],
    });

    return newDataUser;
  }

  async DeleteUser(id: string): Promise<User | null> {
    this.FindUserById(id);
    //handle delete time
    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    await this.cache.cacheState<User>({ model: 'user', storeKey: 'all_users' });

    return deletedUser;
  }

  async UpdateUserTransaction(id: string, data: UpdateUserDto): Promise<User | null> {
    const { name, password, role } = data;

    const [newDataUser, allUsers] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: {
          name: name,
          password: password ? PasswordHasher.setHashPassword(password) : undefined,
          role: role,
          updatedAt: new Date(),
        },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      }),
    ]);

    if (!newDataUser || !allUsers) {
      throw new HttpException('error_update_user', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    delete newDataUser.password;

    await this.cache.set('all_users', allUsers);

    return newDataUser;
  }
}
