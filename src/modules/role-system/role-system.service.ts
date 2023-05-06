import { PrismaService } from './../../../prisma/prisma.service';
import { Injectable, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { CreateRoleSystemDto } from './dto/create-role-system.dto';
import { UpdateRoleSystemDto } from './dto/update-role-system.dto';

import { CustomErrorException } from '../utils';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class RoleSystemService {
  constructor(private readonly prisma: PrismaService) {}
  async createRole(createRoleSystemDto: CreateRoleSystemDto) {
    const { name, permissions } = createRoleSystemDto;

    const role_in_db = await this.prisma.role.findFirst({
      where: {
        name,
      },
    });

    if (role_in_db) throw new ForbiddenException('role_already_exists');

    const role = await this.prisma.role.create({
      data: {
        name,
        permissions: permissions || 'READ',
        createdAt: new Date(),
      },
    });

    if (!role)
      throw new CustomErrorException({
        errorType: 'Role',
        value: 'name',
        errorCase: 'role_not_created',
      });

    return role;
  }

  async findAllRoles() {
    const roles = await this.prisma.role.findMany({
      select: {
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
        user: true,
      },
    });

    return roles ?? [];
  }

  async findRoleByName(name: string): Promise<Role | CustomErrorException> {
    try {
      const role = await this.prisma.role.findUnique({
        where: {
          name,
        },
      });

      if (!role)
        throw new CustomErrorException({
          errorType: 'Role',
          value: 'name',
          errorCase: 'role_not_found',
        });

      return role;
    } catch (e) {
      console.log(e);
      if (e instanceof CustomErrorException) {
        throw e;
      } else {
        throw new CustomErrorException({
          errorCase: 'post_not_found',
          errorType: 'Post',
          value: e,
          prismaError: e as Prisma.PrismaClientKnownRequestError,
        });
      }
    }
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: {
        id,
      },
    });

    if (!role)
      throw new CustomErrorException({
        errorType: 'Role',
        value: 'id',
        errorCase: 'role_not_found',
      });

    return role;
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleSystemDto) {
    const { name, permissions } = updateRoleDto;
    const role = await this.prisma.role.update({
      where: {
        id,
      },
      data: {
        permissions,
        name,
      },
      include: {
        user: true,
      },
    });

    if (!role)
      throw new CustomErrorException({
        errorType: 'Role',
        value: 'id',
        errorCase: 'role_not_updated',
      });

    return role;
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.delete({
      where: {
        id,
      },
    });

    if (!role)
      throw new CustomErrorException({
        errorType: 'Role',
        value: 'id',
        errorCase: 'role_not_deleted',
      });

    return role;
  }
}
