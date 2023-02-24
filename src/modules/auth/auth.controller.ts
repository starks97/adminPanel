import { CreateUserDto } from './../user/dto/create-user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginUserDto } from '../user/dto';
import { Response } from 'express';
//import { CreateAuthDto } from './dto/create-auth.dto';
//import { UpdateAuthDto } from './dto/update-auth.dto';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.SignUp(createUserDto);
  }
  @Post('signin')
  async findByLogin(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const response = await this.authService.SignIn({ email, password });

    if (!response) throw new ForbiddenException('user_not_logged');

    res.cookie('auth_token', response.data.token, {
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1.5),
    });

    if (res.cookie === undefined) throw new ForbiddenException('cookie_not_created');

    return res.status(200).json(response);
  }
}
