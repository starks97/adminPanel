import { CustomErrorException } from './../../utils/handlerError';
import { AuthService } from './../auth.service';
import { PrismaService } from './../../../../prisma/prisma.service';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@prisma/client';
/**
 * RoleGuard is an injectable class that implements the CanActivate interface to provide role-based
 * authorization for endpoints.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  /**
   * Create an instance of the RoleGuard class.
   *
   * @param reflector - The reflector instance for metadata retrieval.
   * @param prisma - The PrismaService instance for interacting with the database.
   * @param auth - The AuthService instance for token decoding and user retrieval.
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}
  /**
   * Check if the user has the required permissions to access the requested endpoint.
   *
   * @param context - The execution context.
   * @returns A promise that resolves to a boolean indicating if the user has the required
   *   permissions.
   * @throws CustomErrorException if the requested permissions are not found, token is not found,
   *   user is not found, or user doesn't have enough permission.
   * @throws ForbiddenException if the token is not found or there is a general authorization error.
   */
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
