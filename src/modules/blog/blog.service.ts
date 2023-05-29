import { CloudinarySystemService } from './cloudinary/cloudinary-system.service';
import { createPostSchema } from './dto/create-blog.dto';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto, SearchPostDto, UpdatePostDto } from './dto';

import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException } from '../utils';
import { Post, Prisma, Resource } from '@prisma/client';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly cloudinary: CloudinarySystemService,
  ) {}

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
    files: Array<Express.Multer.File>,
  ): Promise<Post | CustomErrorException> {
    try {
      const { title, content, description, category, tags } = createPostDto;

      const uploadImages = await this.cloudinary.upload(files);

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
          tags,
          category,
          resources: {
            createMany: {
              data: uploadImages,
            },
          },
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
      console.log(e);
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

  async findAllPosts(
    offset: number,
    limit: number,
  ): Promise<{ posts: Post[]; total: number } | []> {
    try {
      const limitsValues = [10, 20, 50];

      if (limitsValues.includes(limit) === false) {
        throw new CustomErrorException({
          errorCase: 'invalid_limit',
          errorType: 'Post',
          value: limit,
        });
      }
      const dataCache = await this.cache.get(`posts:${offset}:${limit}`);

      if (dataCache) return dataCache;

      const posts = await this.prisma.post.findMany({
        skip: offset * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          resources: true,
        },
      });

      const data = { posts, total: posts.length };

      console.log('from DB', data);

      await this.cache.cacheState<Post[]>({
        model: 'post',
        storeKey: `posts:${offset}:${limit}`,
        limit,
        offset,
      });

      return data || [];
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

  async findPostById(id: string): Promise<Post | CustomErrorException> {
    try {
      const dataCache = await this.cache.get('post:' + id);
      if (dataCache) return dataCache;
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          resources: true,
        },
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

  async findPostByQuery(q: string, offset: number, limit: number) {
    try {
      const posts = await this.prisma.post.findMany({
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
        skip: offset,
        take: limit,
        include: {
          resources: true,
        },
      });

      const data = { posts, total: posts.length };

      if (!posts) throw new NotFoundException(`Post with query ${q} not found`);

      await this.cache.cacheState<Post[]>({ model: 'post', storeKey: 'posts', limit, offset });

      return data;
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

  async findPostByCategory(params: SearchPostDto) {
    try {
      const dataCache = await this.cache.get('post:' + params?.category);
      if (dataCache) return dataCache;
      const posts = await this.prisma.post.findMany({
        where: {
          OR: [
            {
              category: {
                equals: params?.category,
              },
            },
          ],
        },
        skip: params?.offset,
        take: params?.limit,
        include: {
          resources: true,
        },
      });

      if (!posts) throw new NotFoundException(`Post with category ${params?.category} not found`);
      const data = { posts, total: posts.length };

      await this.cache.set('post:' + params?.category, data, 60);

      return data;
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

  async updatePost(id: string, updatePostDto: UpdatePostDto) {
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          ...updatePostDto,
          updatedAt: new Date(),
        },
      });

      if (!post)
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: id,
        });

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
      return post;
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

  async deletePost(id: string) {
    try {
      const post = await this.prisma.post.delete({
        where: { id },
      });

      if (!post)
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: id,
        });

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
      return post;
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

  async updateResources(id: string, resources: Resource[]) {
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          resources: {
            create: resources,
          },
        },
      });

      if (!post)
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: id,
        });

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
      return post;
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
}
