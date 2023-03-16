import { SetMetadata, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export const Role = (...args: string[]) => SetMetadata('role', args);
