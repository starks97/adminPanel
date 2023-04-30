import { AuthService } from './../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './../../../../prisma/prisma.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requestedPermissions = this.reflector.get<string>('permissions', context.getHandler());

    const { headers } = context.switchToHttp().getRequest();

    const token = headers.authorization.replace('Bearer ', '');
    if (!token) return false;

    /*const userRole = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        role: true,
      },
    });
*/
    console.log(token);

    return true;
  }
}
