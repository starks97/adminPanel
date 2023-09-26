import { AuthErrorHandler, CustomErrorException, errorCases } from './../../utils/handlerError';
import { PrismaService } from './../../../../prisma/prisma.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
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
    private readonly jwtService: JwtService,
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
        throw new AuthErrorHandler('Token', errorCases.TOKEN_NOT_FOUND, 405);

      const token = headers.authorization.replace('Bearer ', '');

      if (!token) return false;

      const decodeToken = this.jwtService.decode(token);

      const user = await this.prisma.user.findUnique({
        where: {
          id: decodeToken['id'],
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
          status: 404,
        });

      const checkPermission = requestedPermissions.every(permission => {
        if (user.role.permissions.includes(permission)) return true;
      });

      if (!checkPermission)
        throw new CustomErrorException({
          errorType: 'User',
          errorCase: 'user_without_enough_permission',
          value: user.id,
          status: 403,
        });

      return true;
    } catch (error) {
      console.log(error);
      if (error instanceof CustomErrorException) {
        throw error;
      }
      throw error.message;
    }
  }
}
