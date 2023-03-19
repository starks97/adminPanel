import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Response, Request } from 'express';

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
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { LoginUserDto, CreateUserDto } from '../user/dto';

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

    res.cookie('auth_token', response.data?.access_token, {
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 15),
    });

    res.cookie('refresh_token', response.data?.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1.5),
    });

    return res.status(200).json(response);
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
