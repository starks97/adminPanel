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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { RoleGuard } from './../auth/guards/role.guard';
import { ProfileUserDto, UpdateUserPasswordDto } from './dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@UseGuards(RoleGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Permission(['UPDATE'])
  @Get()
  async findUserByQueries(
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Query('q') q: string,
    @Res() res: Response,
  ) {
    const userOffset = +offset || 0;
    const userLimit = +limit || 10;

    if (q) {
      const response = await this.userService.FindUserByName(q, userOffset, userLimit);
      return res.status(200).json({ message: 'Users found successfully', data: response });
    }

    const response = await this.userService.FindAllUsers(userOffset, userLimit);
    return res.status(200).json({ message: 'Users found successfully', data: response });
  }
  @Permission(['UPDATE'])
  @Post('/:id')
  async AssignRoleToUser(
    @Param('id') id: string,
    @Body('roleName') roleName: string,
    @Res() res: Response,
  ) {
    const response = await this.userService.AssignRoleToUser(id, roleName);

    return res.status(200).json({ message: 'role_assigned', data: response });
  }
  @Permission(['UPDATE'])
  @Get('/:id')
  findUserById(@Param('id') id: string) {
    return this.userService.FindUserById(id);
  }
  @Permission(['UPDATE'])
  @Patch('/:id')
  async updatePasswordUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserPasswordDto,
    @Res() res: Response,
  ) {
    this.userService.UpdateUserPassword(id, updateUserDto);
    res.removeHeader('auth_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'user_updated' });
  }
  @Permission(['DELETE'])
  @Delete('/:id')
  async removeUser(@Param('id') id: string, @Res() res: Response) {
    this.userService.DeleteUser(id);
    res.removeHeader('auth_token');
    res.clearCookie('refresh_token');

    return res.status(200).json({ message: 'user_deleted' });
  }
  @Permission(['CREATE'])
  @UseInterceptors(FileInterceptor('file'))
  @Patch('/create_profile/:id')
  async userProfile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dataProfile: ProfileUserDto,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const response = await this.userService.createUserProfile(dataProfile, id, file);

    return res.status(200).json({ message: 'user_profile_created', data: response });
  }
}
