import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CustomErrorException, PostNotFoundError } from '../../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Delete resources associated with a blog post.
   *
   * @param postId - The ID of the post to which the resources belong.
   * @param resourcesIds - An array of IDs of the resources to delete.
   * @returns A promise that resolves to the deleted resources.
   * @throws CustomErrorException if the resources could not be deleted or there is a general error.
   */
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
