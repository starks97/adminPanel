import { CloudinarySystemService } from '../cloudinary/cloudinary-system.service';
import { CacheSystemService } from './../cache-system/cache-system.service';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePostDto, SearchPostDto, UpdatePostDto } from './dto';

import { PrismaService } from '../../../prisma/prisma.service';
import { CustomErrorException, errorCases, PostNotFoundError, SlugGenerator } from '../utils';
import { Post, Prisma } from '@prisma/client';

import { ResourcesService } from './resources/resources.service';
/** BlogService is an injectable class that provides methods for managing blog posts. */
@Injectable()
export class BlogService {
  /**
   * Create an instance of the BlogService class.
   *
   * @param prisma - The PrismaService instance for interacting with the database.
   * @param cache - The CacheSystemService instance for caching blog posts.
   * @param cloudinary - The CloudinarySystemService instance for uploading images.
   * @param resource - The ResourcesService instance for managing resources associated with blog
   *   posts.
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSystemService,
    private readonly cloudinary: CloudinarySystemService,
    private readonly resource: ResourcesService,
  ) {
    this.cache._configModel('post', {
      include: {
        resources: true,
        user: true,
      },
    });
  }
  /**
   * Create a new blog post.
   *
   * @param userId - The ID of the user creating the post.
   * @param createPostDto - The DTO containing the details of the post to be created.
   * @param files - An array of files to be uploaded and associated with the post.
   * @returns A promise that resolves to the created post or a CustomErrorException if an error
   *   occurs.
   * @throws CustomErrorException if the post with the same title already exists or there is a
   *   general error.
   */
  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
    files: Array<Express.Multer.File>,
  ): Promise<Post | CustomErrorException> {
    try {
      const { title, description, category, tags, content } = createPostDto;

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
          slug: SlugGenerator.slugify(title),
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
        include: {
          resources: true,
          user: true,
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
  /**
   * Retrieve all blog posts with pagination.
   *
   * @param offset - The number of posts to skip.
   * @param limit - The maximum number of posts to return.
   * @returns A promise that resolves to an object containing the posts and the total count.
   * @throws PostNotFoundError if there is a general error.
   */
  async findAllPosts(offset: number, limit: number) {
    const cacheKey = `blog:offset:${offset}:limit:${limit}`;
    const dataFromCacheShield = await this.cache.cachePagination({
      limit,
      offset,
      newKey: 'blog',
      storeKey: 'posts',
    });

    if (dataFromCacheShield)
      return { posts: dataFromCacheShield, total: dataFromCacheShield.length };

    const dataWhithout = JSON.parse(await this.cache.get(cacheKey));

    if (dataWhithout) return { posts: dataWhithout, total: dataWhithout.length };
    try {
      const skipCount = Math.floor((+offset || 0) - 1) * (+limit || 10);
      const posts = await this.prisma.post.findMany({
        skip: skipCount <= 0 ? 0 : skipCount,
        take: limit || 10,
        orderBy: {
          createdAt: 'desc',
        },

        include: {
          resources: true,
          user: true,
        },
      });

      const data = { posts, total: posts.length };

      this.cache.set(cacheKey, JSON.stringify(posts), 60 * 2);

      return data || [];
    } catch (e) {
      console.log(e.message);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new PostNotFoundError('', e);
      }
      throw e;
    }
  }
  /**
   * Retrieve a blog post by its ID.
   *
   * @param id - The ID of the post to retrieve.
   * @returns A promise that resolves to the retrieved post.
   * @throws PostNotFoundError if the specified post is not found.
   * @throws CustomErrorException if there is a general error.
   */
  async findPostById(id: string) {
    const dataCache = JSON.parse(await this.cache.get('blog:' + id));
    if (dataCache) return dataCache;
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          resources: true,
          user: true,
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
  /**
   * Retrieve a blog post by its slug.
   *
   * This method searches for a blog post in the database using its unique slug. If the post is
   * found, it is returned. If not, an error is thrown.
   *
   * @param {string} slug - The slug of the post to retrieve.
   * @returns {Promise<Post>} A promise that resolves to the retrieved post.
   * @throws {PostNotFoundError} If the specified post is not found.
   * @throws {CustomErrorException} If there is a general error during retrieval.
   */
  async findPostBySlug(slug: string) {
    const dataCache = JSON.parse(await this.cache.get('blog:' + slug));
    if (dataCache) return dataCache;
    try {
      const post = await this.prisma.post.findFirst({
        where: { slug },
        include: {
          resources: true,
          user: true,
        },
      });

      if (!post) throw new PostNotFoundError(slug);

      this.cache.set('blog:' + slug, JSON.stringify(post), 60 * 2);

      return post;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: errorCases.POST_NOT_FOUND,
          errorType: 'Post',
          value: slug,
        });
      }
      throw e;
    }
  }

  /**
   * Retrieve blog posts based on a search query.
   *
   * @param query - The search query parameters.
   * @returns A promise that resolves to an object containing the matching posts and the total
   *   count.
   * @throws CustomErrorException if there is a general error.
   */
  async findPostByQuery(query: SearchPostDto) {
    const { category, limit, offset, tags } = query;

    const cacheParams = {
      tags: ` blog:${tags}:offset:${+offset || 0}:limit:${+limit || 10}`,
      category: `blog:${category}:offset:${+offset || 0}:limit:${+limit || 10}`,
    };

    const dataCache = !tags
      ? JSON.parse(await this.cache.get(cacheParams.category))
      : JSON.parse(await this.cache.get(cacheParams.tags));

    if (dataCache) return { posts: dataCache, total: dataCache.length };

    try {
      const where = {};

      const skipCount = Math.floor((+offset || 0) - 1) * (+limit || 10);

      if (tags && tags.length > 0) {
        where['tags'] = {
          hasEvery: tags,
        };
      }

      if (category) {
        where['category'] = {
          equals: category,
        };
      }

      const posts = await this.prisma.post.findMany({
        where: {
          OR: [where],
        },
        skip: skipCount <= 0 ? 0 : skipCount,
        take: +limit || 10,
        include: {
          resources: true,
          user: true,
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
  }
  /**
   * Update a blog post by its ID.
   *
   * @param id - The ID of the post to update.
   * @param updatePostDto - The updated post data.
   * @param files - Optional array of files to upload.
   * @returns A promise that resolves to the updated post.
   * @throws PostNotFoundError if the specified post is not found.
   * @throws CustomErrorException if there is a general error.
   */
  async updatePost(id: string, updatePostDto: UpdatePostDto, files?: Array<Express.Multer.File>) {
    const cloud = files && files.length > 0 ? await this.cloudinary.upload(files) : undefined;

    const { resourcesIds, title, ...rest } = updatePostDto;

    try {
      const data = await this.prisma.$transaction(async ctx => {
        const post = await ctx.post.findUnique({
          where: { id },
          include: { resources: true },
        });

        if (!post)
          throw new CustomErrorException({
            errorCase: errorCases.POST_NOT_UPDATED,
            errorType: 'Post',
            value: id,
          });

        if (resourcesIds && resourcesIds.length > 0) {
          await this.resource.deleteResources(post.id, resourcesIds);
        }

        const updatePost = await this.prisma.post.update({
          where: { id: post.id },
          data: {
            ...rest,
            updatedAt: new Date(),
            slug: title ? SlugGenerator.slugify(title) : undefined,
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
            user: true,
          },
        });

        if (!updatePost) throw new ForbiddenException('Post not updated');

        return updatePost;
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

  /**
   * Delete a blog post by its ID.
   *
   * @param id - The ID of the post to delete.
   * @returns A promise that resolves to the deleted post.
   * @throws PostNotFoundError if the specified post is not found.
   * @throws CustomErrorException if there is a general error.
   */
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
