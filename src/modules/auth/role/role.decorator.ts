import {
  ExecutionContext,
  Get,
  InternalServerErrorException,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Roles } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export const UserRole = createParamDecorator(async (data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();
  const userId = request.user.id; // Assuming user ID is stored in the request object

  const prismaService = new PrismaService();
  const user = await prismaService.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user.role === Roles.PUBLIC) {
    throw new InternalServerErrorException('the_user_has_not_authorization');
  }

  request.metadata = { role: user.role };
  return true;
});

export const Role = (roles: Roles) => SetMetadata('roles', roles);
