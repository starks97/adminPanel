import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import PasswordHasher from 'src/utils/passwordHasher';
import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUser: CreateUserDto): Promise<User | null> {
    const { email, name, password, role } = createUser;

    // // check if the user exists in the db
    const userInDb = await this.prisma.user.findFirst({
      where: { email },
    });

    const hashedPassword = PasswordHasher.setHashPassword(password);

    if (userInDb) {
      throw new HttpException('user_already_exist', HttpStatus.CONFLICT);
    }

    return await this.prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'PUBLIC',
      },
    });
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

    const { name, role } = user;

    return { email, name, role } as User;
  }

  async FindUserById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }

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
      },
    });

    if (!user) {
      throw new HttpException('user_not_found', HttpStatus.NOT_FOUND);
    }

    return user as User;
  }

  async FindAllUsers(): Promise<User[] | null> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return (users as User[]) || [];
  }

  async UpdateDataUser(id: string, data: UpdateUserDto): Promise<User | null> {
    const { name, password, role } = data;

    const oldDataUser = await this.FindUserById(id);

    const newDataUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: name || oldDataUser.name,
        password: password ? PasswordHasher.setHashPassword(password) : oldDataUser.password,
        role: role || oldDataUser.role,
      },
    });

    return newDataUser;
  }

  async DeleteUser(id: string): Promise<User | null> {
    this.FindUserById(id);

    const deletedUser = await this.prisma.user.delete({
      where: { id },
    });

    return deletedUser;
  }
}
