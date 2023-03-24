import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { Response } from 'express';

import { RoleGuard } from './../auth/guards/role.guard';
import { UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, UserRole } from '../auth/role/role.decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Role(Roles['OWNER'])
  @UseGuards(JwtAuthGuard)
  @Get('all_users')
  async findAllUser() {
    return await this.userService.FindAllUsers();
  }
  @Role(Roles['ADMIN'])
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
