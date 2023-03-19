import { RoleGuard } from './../auth/guards/role.guard';
import { Response } from 'express';

import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Res,
  ForbiddenException,
  Get,
  Patch,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';

import { UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, UserRole } from '../auth/role/role.decorator';
import { Roles } from '@prisma/client';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Role(Roles['OWNER'])
  @UseGuards(JwtAuthGuard)

  //@UseGuards(RoleGuard)
  @Get('all_users')
  async findAllUser() {
    return await this.userService.FindAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDataUser: UpdateUserDto, @Res() res: Response) {
    const response = this.userService.UpdateDataUser(id, updateDataUser);

    if (!response) throw new ForbiddenException('user_not_updated');

    return res.status(200).json({ message: 'user_updated' });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.userService.FindUserById(id);
  }

  @Get()
  searchUser(@Query('search_user_by') query: string) {
    return this.userService.FindUserByEmailorName(query);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Res() res: Response) {
    const response = this.userService.DeleteUser(id);

    if (!response) throw new ForbiddenException('user_not_deleted');

    return res.status(200).json({ message: 'user_deleted' });
  }
}
