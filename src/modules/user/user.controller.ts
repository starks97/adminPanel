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
import { ProfileUserDto, UpdateUserDto, UpdateUserPasswordDto } from './dto';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE', 'DELETE'])
  @UseGuards(RoleGuard)
  @Get('/users')
  async findUserByQueries(
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Query('q') q: string,
    @Res() res: Response,
  ) {
    const userOffset = offset ? parseInt(offset, 10) : 0;
    const userLimit = limit ? parseInt(limit, 10) : 10;

    if (q) {
      const response = await this.userService.FindUserByName(q, userOffset, userLimit);
      return res.status(200).json({ message: 'Users found successfully', data: response });
    }

    const response = await this.userService.FindAllUsers(userOffset, userLimit);
    return res.status(200).json({ message: 'Users found successfully', data: response });
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

    return res.status(200).json({ message: 'role_assigned', data: response.id });
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

    return res.status(200).json({ message: 'user_updated', data: response.id });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @Delete('/:id')
  async removeUser(@Param('id') id: string, @Res() res: Response) {
    const response = await this.userService.DeleteUser(id);

    return res.status(200).json({ message: 'user_deleted', data: response.id });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['CREATE'])
  @UseGuards(RoleGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('/profile')
  async userProfile(
    @UploadedFile() file: Express.Multer.File,
    dataProfile: ProfileUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const userId = req.user['id'];

    const response = await this.userService.createUserProfile(file, dataProfile, userId);

    return res.status(200).json({ message: 'user_profile_created', data: response });
  }
}
