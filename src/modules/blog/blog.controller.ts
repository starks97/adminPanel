import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
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
    const postOffset = offset ? parseInt(offset, 10) : 0;
    const postLimit = limit ? parseInt(limit, 10) : 10;

    if (q) {
      posts = await this.blogService.findPostByQuery(q, postOffset, postLimit);
      return res.status(200).json({ message: 'Post found successfully', data: posts });
    }

    posts = await this.blogService.findAllPosts(postOffset, postLimit);
    return res.status(200).json({ message: 'Posts found successfully', data: posts });
  }

  @Get('post/:id')
  async findPost(@Param('id') id: string, @Res() res: Response) {
    const response = await this.blogService.findPostById(id);
    return res.status(200).json({ message: 'Post found successfully', response });
  }

  @Get('post/category/:category')
  async findPostByCategory(
    @Param() params: SearchPostDto,
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    const postOffset = offset ? parseInt(offset, 10) : 0;
    const postLimit = limit ? parseInt(limit, 10) : 10;
    const response = await this.blogService.findPostByCategory({
      ...params,
      offset: postOffset,
      limit: postLimit,
    });
    return res.status(200).json({ message: 'Post found successfully', response });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @Patch('/post/:id')
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdatePostDto,
    @Res() res: Response,
  ) {
    const response = await this.blogService.updatePost(id, updateBlogDto);

    return res.status(200).json({ message: 'Post updated successfully', response });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['DELETE'])
  @UseGuards(RoleGuard)
  @Delete('/post/:id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.blogService.deletePost(id);

    return res.status(200).json({ message: `Post ${id} was deleted successfully` });
  }
}
