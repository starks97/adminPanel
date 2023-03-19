import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Roles } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requestedRole = this.reflector.get<string>('roles', context.getHandler());

    console.log(Roles[requestedRole] < Roles.PUBLIC);

    return true;
  }
}
