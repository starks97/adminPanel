import { CustomErrorException } from './../../utils/handlerError';
import { AuthService } from './../auth.service';
import { PrismaService } from './../../../../prisma/prisma.service';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const requestedPermissions = this.reflector.get<Permissions[]>(
        'permissions',
        context.getHandler(),
      );

      if (!requestedPermissions)
        throw new CustomErrorException({
          errorCase: 'permission_not_found',
          errorType: 'Permission',
        });

      const { headers } = context.switchToHttp().getRequest();

      if (!headers.authorization)
        throw new ForbiddenException('Token not found, please login to continue!');

      const token = headers.authorization.replace('Bearer ', '');

      if (!token) return false;

      const decodeToken = this.auth._decodeToken(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: decodeToken.id,
        },
        include: {
          role: true,
        },
      });

      if (!user)
        throw new CustomErrorException({
          errorType: 'User',
          errorCase: 'user_not_found',
          value: user.id,
        });

      const checkPermission = requestedPermissions.every(permission => {
        if (user.role.permissions.includes(permission)) return true;
      });

      if (!checkPermission)
        throw new CustomErrorException({
          errorType: 'User',
          errorCase: 'user_without_enough_permission',
          value: user.id,
        });

      return true;
    } catch (e) {
      console.log(e.message);
      if (e instanceof CustomErrorException) throw e;
      throw new ForbiddenException(e.message);
    }
  }
}
