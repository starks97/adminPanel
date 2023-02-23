import { UserService } from './../user/user.service';

import { JWTPayload } from './interfaces/jwt.interface';
import { PrismaService } from './../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

//import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly userService: UserService) {}

  async SignIn() {
    return `This action returns all auth`;
  }

  SignUp(id: number) {
    return `This action returns a #${id} auth`;
  }

  SignOut(id: number) {
    return `This action removes a #${id} auth`;
  }

  async ValidateUser({ id, email }: JWTPayload) {
    const user = await this.userService.FindUserById(id);
    return user;
  }
}
