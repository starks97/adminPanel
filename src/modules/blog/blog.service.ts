import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-blog.dto';
//import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException } from '../utils';
import { Post } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheSystemService) {
    this.cache._configModel('post', {
      include: {
        user: true,
      },
    });
  }
  async createPost(userId: string, createPostDto: CreatePostDto) {
    const { title, content, description } = createPostDto;
    const postInDb = await this.prisma.post.findUnique({
      where: {
        title,
      },
    });

    if (postInDb)
      throw new CustomErrorException({
        errorType: 'Post',
        value: 'title',
        errorCase: 'post_already_exists',
      });

    const post = await this.prisma.post.create({
      data: {
        title,
        content,
        description,
        createdAt: new Date(),
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!post) throw new CustomErrorException({ errorCase: 'post_not_created', errorType: 'Post' });

    await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
  }

  findAll() {
    return `This action returns all blog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blog`;
  }

  /*update(id: number, updateBlogDto: UpdateBlogDto) {
    return `This action updates a #${id} blog`;
  }*/

  remove(id: number) {
    return `This action removes a #${id} blog`;
  }
}
