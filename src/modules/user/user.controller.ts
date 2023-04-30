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
import { Response } from 'express';

import { RoleGuard } from './../auth/guards/role.guard';
import { UpdateUserDto, UpdateUserPasswordDto } from './dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role, UserRole } from '../auth/role/role.decorator';
import { Permission } from '../auth/decorator/permissio.decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['READ'])
  @UseGuards(RoleGuard)
  @Get('all_users')
  async findAllUser() {
    return await this.userService.FindAllUsers();
  }

  @Post(':id')
  async AssignRoleToUser(
    @Param('id') id: string,
    @Body('roleName') roleName: string,
    @Res() res: Response,
  ) {
    const response = await this.userService.AssignRoleToUser(id, roleName);

    return res.status(200).json(response);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findUserById(@Param('id') id: string) {
    return this.userService.FindUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePasswordUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserPasswordDto,
    @Res() res: Response,
  ) {
    const response = await this.userService.UpdateUserPassword(id, updateUserDto);

    return res.status(200).json(response);
  }

  @Get()
  searchUser(@Query('search_user_by') query: string, @Res() res: Response) {
    const response = this.userService.FindUserByEmailorName(query);

    if (!response) throw new ForbiddenException('user_not_found');

    return res.status(200).json(response);
  }

  @Delete(':id')
  removeUser(@Param('id') id: string, @Res() res: Response) {
    const response = this.userService.DeleteUser(id);

    if (!response) throw new ForbiddenException('user_not_deleted');

    return res.status(200).json({ message: 'user_deleted' });
  }
}
