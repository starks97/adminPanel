import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CreateUserDto, LoginUserDto } from '../user/dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const response = await this.authService.SignUp(createUserDto);

    return res.status(200).json(response);
  }

  @Post('/signin')
  async findByLogin(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const response = await this.authService.SignIn({ email, password });

    if (!response) throw new ForbiddenException('user_not_logged');

    res.setHeader('auth_token', response.data?.access_token);

    res.cookie('refresh_token', response.data?.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
    });

    return res.status(200).json(response.data.rest);
  }

  @Post('/logout')
  async logout(@Res() res: Response, @Req() req: Request) {
    const user = req.user['id'];

    await this.authService.deleteUserSession(user);

    res.removeHeader('auth_token');
    res.clearCookie('refresh_token');

    return res.status(200).json({ message: 'user_logged_out', success: true });
  }

  @UseGuards(RefreshTokenGuard)
  @Get('/refresh_token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const user = req.user['id'];

    const response = await this.authService.refreshToken(user, req.cookies.refresh_token);

    res.setHeader('auth_token', response);

    return res.status(200).json({ message: 'token_refreshed', success: true, data: response });
  }
}
