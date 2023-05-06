import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-blog.dto';
import { Request, Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['CREATE'])
  @UseGuards(RoleGuard)
  @Post('/post')
  async create(@Body() createPostDto: CreatePostDto, @Req() req: Request, @Res() res: Response) {
    const user = req.user['id'];
    const post = await this.blogService.createPost(user, createPostDto);
    return res.status(200).json({ message: 'Post created successfully', post });
  }

  @Get('/post')
  async findAll(@Query('q') q: string, @Res() res: Response) {
    const post = await this.blogService.findAllPosts();
    const search_post = await this.blogService.findPostByQuery(q);

    if (q) {
      return res.status(200).json({ message: 'Posts found successfully', search_post });
    }
    return res.status(200).json({ message: 'Posts found successfully', post });
  }

  @Get('post/:id')
  async findPost(@Param('id') id: string, @Res() res: Response) {
    const response = await this.blogService.findPostById(id);
    return res.status(200).json({ message: 'Post found successfully', response });
  }

  @Get('/find_post_by?')
  async findPostBy(@Query('q') q: string, @Res() res: Response) {
    const response = await this.blogService.findPostByQuery(q);
    return res.status(200).json({ message: 'Post found successfully', response });
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
