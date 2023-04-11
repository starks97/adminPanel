import { PrismaService } from '../../../../prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Session, User } from '@prisma/client';
import { CacheSystemService } from '../../cache-system/cache-system.service';

@Injectable()
export class RoleSystemService {
  constructor(private readonly prisma: PrismaService) {}
  async assignRoleAndOverride(userId: string, roleName: string) {
    return await this.prisma.$transaction(async ctx => {
      const user = await ctx.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          role: true,
        },
      });

      if (!user) throw new Error('user_not_found');

      const role = await ctx.role.findUnique({
        where: {
          name: roleName,
        },
      });

      if (!role) throw new Error('role_not_found');

      const userRole = await ctx.user.update({
        where: {
          id: userId,
        },

        data: {
          role: {
            connect: {
              name: roleName,
            },
          },
        },
      });

      if (!userRole) throw new Error('user_role_not_updated');

      return userRole;
    });
  }
}
