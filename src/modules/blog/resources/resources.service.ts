import { errorCases } from './../../utils/handlerError';
import { CloudinarySystemService } from '../../cloudinary/cloudinary-system.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CustomErrorException, PostNotFoundError } from '../../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloud: CloudinarySystemService,
  ) {}

  async updateResource(id: string, files?: Array<Express.Multer.File>) {
    try {
      const uploadImages = !files ? undefined : await this.cloud.upload(files);

      return await this.prisma.$transaction(async ctx => {
        const post = await ctx.post.findUnique({
          where: {
            id,
          },
          include: {
            resources: true,
          },
        });

        if (!post) throw new PostNotFoundError(id);

        const resources = await ctx.resource.updateMany({
          where: {
            id: {
              in: post.resources.map(resource => resource.id),
            },
          },
          data: {
            url: uploadImages[0].url,
          },
        });

        if (!resources)
          throw new CustomErrorException({
            errorType: 'Resource',
            value: 'id',
            errorCase: 'RESOURCE_NOT_FOUND',
          });

        return resources;
      });
    } catch (e) {
      console.log(e);
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new CustomErrorException({
          errorType: 'Resource',
          value: 'id',
          errorCase: errorCases.PRISMA_ERROR,
        });
      }
      throw e;
    }
  }
}
