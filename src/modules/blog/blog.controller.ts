import { UpdatePostDto } from './dto/update-post.dto';
import { SearchPostDto } from './dto/search-post.dto';
import { JwtAuthGuard } from './../auth/guards/jwt-auth.guard';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
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
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { Category } from '@prisma/client';

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
  @ApiOperation({ summary: 'Create a Post and Resource' })
  @ApiResponse({ status: 200, description: 'Post created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
  })
  @ApiBody({
    description: 'Post Data',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        description: { type: 'string' },
        content: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        category: {
          type: 'enum',
          enum: [
            'GENERAL',
            'TECHNOLOGY',
            'SCIENCE',
            'SPORTS',
            'ENTERTAINMENT',
            'POLITICS',
            'ECONOMY',
            'HEALTH',
            'EDUCATION',
            'OTHER',
          ],
        },
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['title', 'description', 'content', 'tags', 'category', 'files'],
    },
  })
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 10,
            message: 'Max file size allowed is 10MB',
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    const user = req.user['id'];

    const post = await this.blogService.createPost(user, createPostDto, files);
    return res.status(200).json({ message: 'Post created successfully', post });
  }

  @Get('/post')
  @ApiOperation({ summary: 'Find Posts by Queries' })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'category', type: String, required: false })
  @ApiQuery({ name: 'tags', isArray: true, type: String, required: false })
  @ApiResponse({ status: 200, description: 'Post found successfully' })
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

  @Get('post/:slug')
  @ApiOperation({ summary: 'Find Posts by Slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiResponse({ status: 200, description: 'Post found successfully' })
  async findPostBySlug(@Param('slug') slug: string, @Res() res: Response) {
    const response = await this.blogService.findPostBySlug(slug);
    return res.status(200).json({ message: 'Post found successfully', response });
  }

  @Get('post/:id')
  @ApiOperation({ summary: 'Find Posts by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post found successfully' })
  async findPost(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    const response = await this.blogService.findPostById(id);
    return res.status(200).json({ message: 'Post found successfully', response });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['UPDATE'])
  @UseGuards(RoleGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @Patch('/post/:id')
  @ApiOperation({ summary: 'Update Post and Resources' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePostDto, description: 'Post Data' })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdatePostDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 10,
            message: 'Max file size allowed is 10MB',
          }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    const response = await this.blogService.updatePost(id, updateBlogDto, files);

    return res.status(200).json({ message: 'Post updated successfully', response });
  }

  @UseGuards(JwtAuthGuard)
  @Permission(['DELETE'])
  @UseGuards(RoleGuard)
  @Delete('/post/:id')
  @ApiOperation({ summary: 'Delete Post and Resources' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.blogService.deletePost(id);

    return res.status(200).json({ message: `Post ${id} was deleted successfully` });
  }
}
