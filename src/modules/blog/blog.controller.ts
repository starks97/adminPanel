import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';

import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-blog.dto';
import { Request } from 'express';
//import { CreateBlogDto } from './dto/create-blog.dto';
//import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}
  @Post('/create_post')
  create(@Body() createBlogDto: CreatePostDto, @Req() req: Request) {
    const userID = req.headers.authorization;

    console.log(userID);

    //return this.blogService.createPost(createBlogDto);
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
