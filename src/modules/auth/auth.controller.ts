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

  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const response = await this.authService.SignUp(createUserDto);

    return res.status(200).json(response);
  }

  //@UseGuards(LocalAuthGuard)
  @Post('signin')
  async findByLogin(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const response = await this.authService.SignIn({ email, password });

    if (!response) throw new ForbiddenException('user_not_logged');

    res.setHeader('auth_token', response.data.access_token);
    res.setHeader('refresh_token', response.data.refresh_token);

    return res.status(200).json(response.data.rest);
  }

  @Post('logout')
  async logout(@Res() res: Response, @Req() req: Request) {
    const decoded = Object.values(this.authService._decodeToken(req.cookies.refresh_token));

    await this.authService.deleteUserSession(decoded[0]);

    res.clearCookie('auth_token');
    res.clearCookie('refresh_token');
    return res.status(200).json({ message: 'user_logged_out', success: true });
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh_token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    console.log(req.headers);
    const decoded = Object.values(this.authService._decodeToken(req.cookies.refresh_token));

    const response = await this.authService.refreshToken(decoded[0], req.cookies.refresh_token);

    res.cookie('auth_token', response, {
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 15),
    });

    return res.status(200).json({ message: 'token_refreshed', success: true, data: response });
  }
}
