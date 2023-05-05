import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-blog.dto';
import { Request, Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
//import { CreateBlogDto } from './dto/create-blog.dto';
//import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['CREATE'])
  @UseGuards(RoleGuard)
  @Post('/create_post')
  async create(@Body() createPostDto: CreatePostDto, @Req() req: Request, @Res() res: Response) {
    const user = req.user['id'];
    const post = await this.blogService.createPost(user, createPostDto);
    return res.status(200).json({ message: 'Post created successfully', post });
  }

  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.findOne(+id);
  }

  /*@Patch(':id')
  update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
    return this.blogService.update(+id, updateBlogDto);
  }*/

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogService.remove(+id);
  }
}
