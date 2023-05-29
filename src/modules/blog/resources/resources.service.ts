import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CustomErrorException } from '../../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async updateResource(id: string) {
    try {
      return await this.prisma.$transaction(async ctx => {
        const post = await ctx.post.findUnique({
          where: {
            id,
          },
        });

        if (!post)
          throw new CustomErrorException({
            errorType: 'Post',
            errorCase: 'post_not_found',
            value: id,
          });
      });
    } catch (e) {
      console.log(e);
      if (e instanceof CustomErrorException) {
        throw e;
      } else {
        throw new CustomErrorException({
          errorCase: 'resource_not_updated',
          errorType: 'Post',
          value: e,
          prismaError: e as Prisma.PrismaClientKnownRequestError,
        });
      }
    }
  }
}
