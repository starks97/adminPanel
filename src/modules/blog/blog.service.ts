import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-blog.dto';
//import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException } from '../utils';
import { Category, Post, Prisma, User } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService, private readonly cache: CacheSystemService) {}

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<Post | CustomErrorException> {
    try {
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
      });

      if (!post)
        throw new CustomErrorException({ errorCase: 'post_not_created', errorType: 'Post' });

      await this.cache.cacheState<Post>({
        model: 'post',
        storeKey: 'posts',
      });

      return post;
    } catch (e) {
      console.log(e.messsage);
      if (e instanceof CustomErrorException) {
        throw e;
      } else {
        throw new CustomErrorException({
          errorCase: 'post_not_created',
          errorType: 'Post',
          value: e,
          prismaError: e as Prisma.PrismaClientKnownRequestError,
        });
      }
    }
  }

  async findAllPosts(): Promise<Post[]> {
    const dataCache = await this.cache.get('posts');
    if (dataCache) return dataCache;
    const posts = await this.prisma.post.findMany({
      skip: 0,
      take: 10,
    });

    await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });

    return posts || [];
  }

  async findPostById(id: string): Promise<Post | CustomErrorException> {
    try {
      const dataCache = await this.cache.get('post:' + id);
      if (dataCache) return dataCache;
      const post = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!post) throw new NotFoundException(`Post with ID ${id} not found`);

      await this.cache.set('post:' + id, post, 60);

      return post;
    } catch (e) {
      console.log(e.message);
      if (e instanceof CustomErrorException) {
        throw e;
      } else {
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: e,
          prismaError: e as Prisma.PrismaClientKnownRequestError,
        });
      }
    }
  }

  async findPostByQuery(q: string): Promise<Post | CustomErrorException> {
    try {
      const dataCache = await this.cache.get('posts');
      if (dataCache) return dataCache;
      const posts = await this.prisma.post.findFirst({
        where: {
          OR: [
            {
              title: {
                contains: q,
              },
            },
            {
              tags: {
                has: q,
              },
            },
          ],
        },
      });

      if (!posts) throw new NotFoundException(`Post with query ${q} not found`);

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });

      return posts;
    } catch (e) {
      console.log(e);
      if (e instanceof CustomErrorException) {
        throw e;
      } else {
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: e,
          prismaError: e as Prisma.PrismaClientKnownRequestError,
        });
      }
    }
  }

  /*update(id: number, updateBlogDto: UpdateBlogDto) {
    return `This action updates a #${id} blog`;
  }*/

  remove(id: number) {
    return `This action removes a #${id} blog`;
  }
}
