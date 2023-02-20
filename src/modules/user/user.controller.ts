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
} from '@nestjs/common';

import { ApiTags } from '@nestjs/swagger';

import { UserService } from './user.service';

import { CreateUserDto, LoginUserDto, UpdateUserDto } from './dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create_account')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Post('login')
  findByLogin(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const response = this.userService.FindByLogin({ email, password });

    if (!response) throw new ForbiddenException('user_not_logged');

    return res.status(200).json({ message: 'user_logged' });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDataUser: UpdateUserDto, @Res() res: Response) {
    const response = this.userService.UpdateDataUser(id, updateDataUser);

    if (!response) throw new ForbiddenException('user_not_updated');

    return res.status(200).json({ message: 'user_updated' });
  }

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
