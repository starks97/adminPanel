import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { CreateUserDto, LoginUserDto } from '../user/dto';
import { AUTH_TOKEN, REFRESH_TOKEN, expirationTime } from 'src/consts';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @ApiOperation({ summary: 'Sign Up User' })
  @ApiResponse({ status: 201, description: 'Created Successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Email already register' })
  @ApiBody({ type: CreateUserDto, description: 'User Data' })
  @ApiConsumes('multipart/form-data')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
    const response = await this.authService.SignUp(createUserDto);

    return res.status(200).json(response);
  }

  @Post('/signin')
  @ApiOperation({ summary: 'Sign in' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not logged' })
  @ApiBody({ type: LoginUserDto, description: 'User Data' })
  @ApiConsumes('multipart/form-data', 'application/json')
  async findByLogin(@Body() { email, password }: LoginUserDto, @Res() res: Response) {
    const response = await this.authService.SignIn({ email, password });

    res.setHeader(AUTH_TOKEN, response.data?.access_token);
    res.cookie(REFRESH_TOKEN, response.data?.refresh_token, {
      maxAge: expirationTime,
      sameSite: 'none',
    });

    return res.status(200).json(response);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({ status: 200, description: 'Successful logout' })
  async logout(@Res() res: Response, @Req() req: Request) {
    this.authService.deleteUserSession(req.user['email']);
    if (req.headers.authorization) {
      delete req.headers.authorization;
    }
    res.clearCookie(REFRESH_TOKEN);

    return res.status(200).json({ message: 'user_logged_out', success: true });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh_token')
  @ApiOperation({ summary: 'Refresh Token' })
  @ApiSecurity('refresh_token')
  @ApiResponse({ status: 200, description: 'Token refreshed', type: String })
  @ApiResponse({ status: 401, description: 'Unauthorized from refresh' })
  async refreshToken(@Body('refresh_token') refreshToken: string, @Res() res: Response) {
    const response = await this.authService.refreshToken(refreshToken);
    res.setHeader(AUTH_TOKEN, response.data.access_token);
    res.cookie(REFRESH_TOKEN, response.data.refresh_token, {
      maxAge: expirationTime,
      secure: true,
      sameSite: 'none',
    });

    return res.status(200).json({ message: 'token_refreshed', success: true, data: response });
  }
}
