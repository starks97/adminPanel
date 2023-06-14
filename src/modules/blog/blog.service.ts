import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { CreatePostDto, SearchPostDto, UpdatePostDto } from './dto';

import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException, errorCases, PostNotFoundError } from '../utils';
import { Post, Prisma } from '@prisma/client';

import { ResourcesService } from './resources/resources.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly cloudinary: CloudinarySystemService,
    private readonly resource: ResourcesService,
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
          errorCase: errorCases.POST_ALREADY_EXISTS,
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
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_CREATED,
          errorType: 'Post',
        });

      await this.cache.cacheState<Post>({
        model: 'post',
        storeKey: 'posts',
      });

      return post;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(userId, e);
      }
      throw e;
    }
  }

  async findAllPosts(offset: number, limit: number) {
    const dataWhithout = JSON.parse(await this.cache.get(`posts:${offset}:${limit}`));

    const dataFromCacheShield = await this.cache.cachePagination('posts', offset, limit, 'post');

    if (!dataFromCacheShield) {
      if (dataWhithout) return dataWhithout;
    } else {
      return dataFromCacheShield;
    }

    //if (dataCache) return { posts: JSON.parse(dataCache), total: JSON.parse(dataCache).length };
    try {
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

      await this.cache.set(`post:${offset}:${limit}`, JSON.stringify(data), 1000);

      //await this.cache.cacheState<Post>({ model: 'post', storeKey: `posts:${offset}:${limit}` });

      return data || [];
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError('', e);
      }
      throw e;
    }
  }

  async findPostById(id: string) {
    const dataCache = await this.cache.get('post:' + id);
    if (dataCache) return dataCache;
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          resources: true,
        },
      });

      if (!post) throw new PostNotFoundError(id);

      await this.cache.set('post:' + id, post, 60);

      return post;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_FOUND,
          errorType: 'Post',
          value: id,
        });
      }
      throw e;
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

      if (!posts) throw new PostNotFoundError(q);

      await this.cache.cacheState<Post[]>({ model: 'post', storeKey: 'posts' });

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(q, e);
      }
      throw e;
    }
  }

  async findPostByCategory(params: SearchPostDto) {
    const cacheKey = `post:${params?.category}:${params?.offset}:${params?.limit}`;

    try {
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

      await this.cache.set(cacheKey, data, 60);

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_FOUND,
          errorType: 'Post',
          value: params?.category,
        });
      }
      throw e;
    }
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto, files: Array<Express.Multer.File>) {
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          ...updatePostDto,
          updatedAt: new Date(),
        },
      });

      if (!post) throw new PostNotFoundError(id);

      await this.resource.updateResource(id, files);

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
      return post;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(id, e);
      }
      throw e;
    }
  }

  async deletePost(id: string) {
    try {
      const post = await this.prisma.post.delete({
        where: { id },
      });

      if (!post) throw new PostNotFoundError(id);

      await this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
      return post;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(id, e);
      }
      throw e;
    }
  }
}
