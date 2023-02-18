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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
//import { CreateAuthDto } from './dto/create-auth.dto';
//import { UpdateAuthDto } from './dto/update-auth.dto';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  public async register(
    @Body() createUser: CreateAuthDto,
  ) {
    return console.log(createUser);
  }

  @Post('signin')
  findAll() {
    return this.authService.findAll();
  }

  @Get('signout')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }
}
