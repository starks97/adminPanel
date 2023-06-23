import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException, HttpException, ForbiddenException } from '@nestjs/common';
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

      await this.cache.set(`blog:${offset}:${limit}`, JSON.stringify(data), 60);

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

      await this.cache.set('blog:' + id, JSON.stringify(post), 60);

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

  async findPostByTags(tag: string[], offset: number, limit: number) {
    const dataCacheShield = await this.cache.cachePagination({
      limit,
      offset,
      newKey: `blog:${tag}`,
      storeKey: 'posts',
    });

    if (dataCacheShield) return { posts: dataCacheShield, total: dataCacheShield.length };

    const dataWhithout = JSON.parse(await this.cache.get(`blog:${tag}:${offset}:${limit}`));

    if (dataWhithout) return { posts: dataWhithout, total: dataWhithout.length };

    try {
      if (!tag) throw new NotFoundException('Please provide a tag to search for posts.');

      const posts = await this.prisma.post.findMany({
        where: {
          OR: [
            {
              tags: {
                hasEvery: tag,
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

      if (!posts) throw new PostNotFoundError(tag);

      await this.cache.set(`blog:${tag}:${offset}:${limit}`, JSON.stringify(posts), 60);

      return data;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError(tag, e);
      }
      throw e;
    }
  }

  async findPostByCategory(params: SearchPostDto) {
    const cacheKey = `blog:${params?.category}:${params?.offset}:${params?.limit}`;

    const cacheData = JSON.parse(await this.cache.get(cacheKey));

    if (cacheData) return { posts: cacheData, total: cacheData.length };

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

      await this.cache.set(cacheKey, JSON.stringify(posts), 60);

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

  async updatePost(id: string, updatePostDto: UpdatePostDto, files?: Array<Express.Multer.File>) {
    const cloud = !files ? null : await this.cloudinary.upload(files);

    const data = cloud.map(item => {
      return { url: item.url, resource_type: item.resource_type };
    });

    try {
      const post = await this.prisma.post.update({
        where: { id },
        data: {
          ...updatePostDto,
          updatedAt: new Date(),
        },
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
