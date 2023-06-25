import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  BadRequestException,
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
  UsePipes,
} from '@nestjs/common';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-blog.dto';
import { Request, Response } from 'express';
import { RoleGuard } from '../auth/guards/role.guard';
import { Permission } from '../auth/decorator/permissio.decorator';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';

@ApiTags('Blog')
@Controller('blog')
@UsePipes(ZodValidationPipe)
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
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'tags', isArray: true, type: String, required: false })
  @ApiResponse({ status: 200, description: 'Post found successfully' })
  @Get('/post')
  async findAllPosts(@Query() query: SearchPostDto, @Res() res: Response) {
    const postOffset = +query.offset || 0;
    const postLimit = +query.limit || 10;

    if (query.category || query.tags) {
      const posts = await this.blogService.findPostByQuery(query);
      return res.status(200).json({ message: 'Post found successfully', data: posts });
    }

    const posts = await this.blogService.findAllPosts(postOffset, postLimit);
    return res.status(200).json({ message: 'Post found successfully', data: posts });
  }

  @Get('post/:id')
  async findPost(@Param('id') id: string, @Res() res: Response) {
    const response = await this.blogService.findPostById(id);
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
