import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException, HttpException, ForbiddenException } from '@nestjs/common';
import { CreatePostDto, SearchPostDto, UpdatePostDto } from './dto';

import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException, errorCases, PostNotFoundError } from '../utils';
import { Post, Prisma } from '@prisma/client';

import { ResourcesService } from './resources/resources.service';

interface Query {
  query: string | SearchPostDto;
  offset: number;
  limit: number;
}

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly cloudinary: CloudinarySystemService,
    private readonly resource: ResourcesService,
  ) {
    this.cache._configModel('post', {
      include: {
        resources: true,
      },
    });
  }

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

      this.cache.cacheState<Post>({
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
    const dataFromCacheShield = await this.cache.cachePagination({
      limit,
      offset,
      newKey: 'blog',
      storeKey: 'posts',
    });

    if (dataFromCacheShield)
      return { posts: dataFromCacheShield, total: dataFromCacheShield.length };

    const dataWhithout = JSON.parse(await this.cache.get(`blog:${offset}:${limit}`));

    if (dataWhithout) return { posts: dataWhithout.posts, total: dataWhithout.total };
    try {
      const posts = await this.prisma.post.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          resources: true,
        },
      });

      const data = { posts, total: posts.length };

      this.cache.set(`blog:${offset}:${limit}`, JSON.stringify(posts), 60 * 2);

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
    const dataCache = JSON.parse(await this.cache.get('blog:' + id));
    if (dataCache) return dataCache;
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          resources: true,
        },
      });

      if (!post) throw new PostNotFoundError(id);

      this.cache.set('blog:' + id, JSON.stringify(post), 60 * 2);

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

  async findPostByTags(tags: string[], offset: number, limit: number) {
    const dataWhithout = JSON.parse(await this.cache.get(`blog:${tags}:${offset}:${limit}`));

    if (dataWhithout) return { posts: dataWhithout, total: dataWhithout.length };

    try {
      if (!tags) throw new NotFoundException('Please provide a tag to search for posts.');

      const posts = await this.prisma.post.findMany({
        where: {
          OR: [
            {
              tags: {
                hasEvery: tags,
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

      if (!posts) throw new PostNotFoundError(tags);

      this.cache.set(`blog:${tags}:${offset}:${limit}`, JSON.stringify(posts), 60 * 2);

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(tags, e);
      }
      throw e;
    }
  }

  /*async findPostByQuery(query: SearchPostDto) {
    const { category, limit, offset, tags } = query;

    const cacheParams = {
      tags: ` blog:${tags}:${offset}:${limit}`,
      category: `blog:${category}:${offset}:${limit}`,
    };

    const dataCache = !tags
      ? JSON.parse(await this.cache.get(cacheParams.category))
      : JSON.parse(await this.cache.get(cacheParams.tags));

    if (dataCache) return { posts: dataCache, total: dataCache.length };

    try {
      const posts = await this.prisma.post.findMany({
        where: {
          category: {
            equals: category,
          },
          OR: [
            {
              tags: {
                hasEvery: tags,
              },
            },
          ],
        },
      });

      if (!posts) throw new NotFoundException('Post not found');

      const data = { posts, total: posts.length };

      tags
        ? this.cache.set(cacheParams.tags, JSON.stringify(posts), 60)
        : this.cache.set(cacheParams.category, JSON.stringify(posts), 60);

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_FOUND,
          errorType: 'Post',
        });
      }

      throw e;
    }
  }*/

  async findPostByCategory(params: SearchPostDto) {
    const { category, limit, offset } = params;

    const cacheKey = `blog:${category}:${offset}:${limit}`;

    const cacheData = JSON.parse(await this.cache.get(cacheKey));

    if (cacheData) return { posts: cacheData, total: cacheData.length };

    try {
      const posts = await this.prisma.post.findMany({
        where: {
          OR: [
            {
              category: {
                in: category,
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

      if (!posts) throw new NotFoundException(`Post with category ${category} not found`);
      const data = { posts, total: posts.length };

      this.cache.set(cacheKey, JSON.stringify(posts), 60);

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_FOUND,
          errorType: 'Post',
          value: category,
        });
      }
      throw e;
    }
  }

  async updatePost(id: string, updatePostDto: UpdatePostDto, files?: Array<Express.Multer.File>) {
    const cloud = files && files.length > 0 ? await this.cloudinary.upload(files) : undefined;

    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          ...updatePostDto,
          updatedAt: new Date(),
          resources: cloud
            ? {
                createMany: {
                  data: cloud,
                },
              }
            : undefined,
        },
        include: {
          resources: true,
        },
      });

      if (!post)
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_UPDATED,
          errorType: 'Post',
          value: id,
        });

      this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });
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
      const data = await this.prisma.$transaction(async ctx => {
        const post = await ctx.post.delete({
          where: { id },
        });

        if (!post) throw new PostNotFoundError(id);

        await ctx.resource.deleteMany({
          where: {
            postId: post.id,
          },
        });

        return post;
      });

      this.cache.cacheState<Post>({ model: 'post', storeKey: 'posts' });

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(id, e);
      }
      throw e;
    }
  }
}
