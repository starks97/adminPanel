import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CustomErrorException, PostNotFoundError } from '../../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteResources(postId: string, resourcesIds: string[]) {
    try {
      const resource = await this.prisma.resource.deleteMany({
        where: {
          postId,

          id: {
            in: resourcesIds,
          },
        },
      });

      if (!resource)
        throw new CustomErrorException({
          errorCase: 'The resources could not be deleted',
          errorType: 'Resource',
          value: postId,
        });

      return resource;
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorCase: e.name,
          errorType: 'Resource',
          value: postId,
          prismaError: e,
        });
      }
      throw e;
    }
  }
}
