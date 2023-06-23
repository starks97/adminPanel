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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-blog.dto';
import { Request, Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
import { ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Permission(['CREATE'])
  @UseGuards(RoleGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Post('/post')
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const user = req.user['id'];

    const post = await this.blogService.createPost(user, createPostDto, files);
    return res.status(200).json({ message: 'Post created successfully', post });
  }

  @Get('/posts')
  async findAllPosts(
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    let posts;
    const postOffset = offset ? parseInt(offset, 10) : 0;
    const postLimit = limit ? parseInt(limit, 10) : 10;

    posts = await this.blogService.findAllPosts(postOffset, postLimit);
    return res.status(200).json({ message: 'Posts found successfully', data: posts });
  }

  @Get('/post')
  async findPostByTag(
    @Query('tag') tag: string[],
    @Query('offset') offset: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    let posts;
    const postOffset = offset ? parseInt(offset, 10) : 0;
    const postLimit = limit ? parseInt(limit, 10) : 10;

    posts = await this.blogService.findPostByTags(tag, postOffset, postLimit);
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
  @UseInterceptors(FilesInterceptor('files'))
  @Patch('/post/:id')
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdatePostDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    const response = await this.blogService.updatePost(id, updateBlogDto, files);

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
