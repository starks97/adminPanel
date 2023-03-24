// jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Roles, User } from '@prisma/client';

import { JWTPayload } from './../interfaces/jwt.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../role/role.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(ctx: ExecutionContext) {
    const requiredRole = this.reflector.getAllAndOverride<Roles>('roles', [
      ctx.getClass(),
      ctx.getHandler(),
    ]);

    console.log({ requiredRole });

    //this is the function key, because take all the info from the decoded function and return payload
    const result = (await super.canActivate(ctx)) as boolean;
    const request = ctx.switchToHttp().getRequest();
    const user: JWTPayload = request.user;
    console.log({ user });

    if (!result) return false;

    if (Roles[user.role] <= requiredRole) return false;

    return result;
  }
}
