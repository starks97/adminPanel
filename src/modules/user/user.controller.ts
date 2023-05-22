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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { RoleGuard } from './../auth/guards/role.guard';
import { UpdateUserDto, UpdateUserPasswordDto } from './dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../auth/decorator/permissio.decorator';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE', 'DELETE'])
  @UseGuards(RoleGuard)
  @Get('/user')
  async findAllUser() {
    return await this.userService.FindAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE', 'DELETE'])
  @UseGuards(RoleGuard)
  @Post('/:id')
  async AssignRoleToUser(
    @Param('id') id: string,
    @Body('roleName') roleName: string,
    @Res() res: Response,
  ) {
    const response = await this.userService.AssignRoleToUser(id, roleName);

    return res.status(200).json(response);
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @Get('/:id')
  findUserById(@Param('id') id: string) {
    return this.userService.FindUserById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @Patch('/:id')
  async updatePasswordUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserPasswordDto,
    @Res() res: Response,
  ) {
    const response = await this.userService.UpdateUserPassword(id, updateUserDto);

    return res.status(200).json(response);
  }

  @Get('/user')
  async searchUser(@Query('q') query: string, @Res() res: Response) {
    const response = await this.userService.FindUserByEmailorName(query);

    return res.status(200).json(response);
  }
  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @Delete('/user/:id')
  removeUser(@Param('id') id: string, @Res() res: Response) {
    const response = this.userService.DeleteUser(id);

    if (!response) throw new ForbiddenException('user_not_deleted');

    return res.status(200).json({ message: 'user_deleted' });
  }
}
