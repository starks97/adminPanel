import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  ForbiddenException,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get all users by queries', description: 'Get all users by queries' })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'q', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Users found successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
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
  @ApiOperation({ summary: 'Asign role to user', description: 'Asign role to user' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { type: 'object', properties: { roleName: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Role assigned successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
  @ApiConsumes('multipart/form-data', 'application/json')
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
  @ApiOperation({ summary: 'Find user by ID', description: 'Find user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User found successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
  findUserById(@Param('id') id: string) {
    return this.userService.FindUserById(id);
  }
  @Permission(['UPDATE'])
  @Patch('/:id')
  @ApiOperation({ summary: 'Update Password of User', description: 'Update Password of User' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserPasswordDto, description: 'User Password Data' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
  @ApiConsumes('multipart/form-data', 'application/json')
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
  @ApiOperation({ summary: 'Delete User', description: 'Delete User' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
  async removeUser(@Param('id') id: string, @Res() res: Response) {
    this.userService.DeleteUser(id);
    res.removeHeader('auth_token');
    res.clearCookie('refresh_token');

    return res.status(200).json({ message: 'user_deleted' });
  }
  @Permission(['CREATE'])
  @UseInterceptors(FileInterceptor('file'))
  @Patch('/create_profile/:id')
  @ApiOperation({ summary: 'Create User Profile', description: 'Create User Profile' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    description: 'User Profile Data',
    schema: {
      type: 'object',
      properties: {
        bio: { type: 'string' },
        lastName: { type: 'string' },
        birthday: { type: 'string' },
        name: { type: 'string' },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['lastName', 'birthday'],
    },
  })
  @ApiResponse({ status: 200, description: 'User profile created successfully' })
  @ApiResponse({ status: 403, description: 'Token not found, please login to continue' })
  @ApiConsumes('multipart/form-data')
  async userProfile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 10,
            message: 'Max file size allowed is 10MB',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dataProfile: ProfileUserDto,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const response = await this.userService.createUserProfile(dataProfile, id, file);

    return res.status(200).json({ message: 'user_profile_created', data: response });
  }
}
