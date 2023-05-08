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
  async findPostByQueries(
    @Query('q') q: string,
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    let posts;

    if (q) {
      posts = await this.blogService.findPostByQuery(q);
      return res.status(200).json({ message: 'Post found successfully', search_post: posts });
    }

    const postOffset = offset ? parseInt(offset, 10) : 0;
    const postLimit = limit ? parseInt(limit, 10) : 10;

    posts = await this.blogService.findAllPosts(postOffset, postLimit);
    return res.status(200).json({ message: 'Posts found successfully', posts });
  }

  @Get('post/:id')
  async findPost(@Param('id') id: string, @Res() res: Response) {
    const response = await this.blogService.findPostById(id);
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
