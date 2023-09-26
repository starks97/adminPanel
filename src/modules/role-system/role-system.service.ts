import { PrismaService } from './../../../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateRoleSystemDto } from './dto/create-role-system.dto';
import { UpdateRoleSystemDto } from './dto/update-role-system.dto';

import { CustomErrorException, errorCases } from '../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoleSystemService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Create a new role with the specified name and permissions.
   *
   * @param createRoleSystemDto - The DTO (Data Transfer Object) containing the role information.
   * @returns A promise that resolves to the created role.
   * @throws ForbiddenException if a role with the same name already exists.
   * @throws CustomErrorException if the role creation fails.
   */
  async createRole(createRoleSystemDto: CreateRoleSystemDto) {
    try {
      const { name, permissions } = createRoleSystemDto;

      const role_in_db = await this.prisma.role.findFirst({
        where: {
          name,
        },
      });

      if (role_in_db)
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: errorCases.ROLE_ALREADY_EXIST,
          value: name,
          status: 409,
        });

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
          status: 400,
        });

      return role;
    } catch (error) {
      console.log(error.message);
      if (error instanceof CustomErrorException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma Error:', error);
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: 'prisma_error',
          prismaError: error,
          status: 500,
        });
      }
      throw error.message;
    }
  }
  /**
   * Retrieve all roles from the database.
   *
   * @returns A promise that resolves to an array of roles.
   */
  async findAllRoles() {
    try {
      const roles = await this.prisma.role.findMany({
        select: {
          name: true,
          permissions: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const data = { roles, total: roles.length };

      return data ?? [];
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Find a role by its name in the database.
   *
   * @param name - The name of the role to find.
   * @returns A promise that resolves to the found role.
   * @throws CustomErrorException if the role is not found or an error occurs during the retrieval.
   */
  async findRoleByName(query: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: {
          name: query,
        },
      });

      if (!role)
        throw new CustomErrorException({
          errorType: 'Role',
          value: query,
          errorCase: 'role_not_found',
          status: 404,
        });

      return role;
    } catch (error) {
      console.log(error.message);
      if (error instanceof CustomErrorException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma Error:', error);
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: 'prisma_error',
          prismaError: error,
          status: 404,
        });
      }
      throw error.message;
    }
  }
  /**
   * Find a role by its ID in the database.
   *
   * @param id - The ID of the role to find.
   * @returns A promise that resolves to the found role.
   * @throws CustomErrorException if the role is not found.
   */
  async findRoleById(id: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: {
          id,
        },
      });

      if (!role)
        throw new CustomErrorException({
          errorType: 'Role',
          value: id,
          errorCase: 'role_not_found',
          status: 404,
        });

      return role;
    } catch (error) {
      console.log(error.message);
      if (error instanceof CustomErrorException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma Error:', error);
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: 'prisma_error',
          prismaError: error,
          status: 404,
        });
      }
      throw error.message;
    }
  }
  /**
   * Update a role in the database based on its ID.
   *
   * @param id - The ID of the role to update.
   * @param updateRoleDto - The DTO containing the updated role data.
   * @returns A promise that resolves to the updated role.
   * @throws CustomErrorException if the role is not updated.
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleSystemDto) {
    try {
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
          value: id,
          errorCase: 'role_not_updated',
          status: 400,
        });

      return role;
    } catch (error) {
      console.log(error.message);
      if (error instanceof CustomErrorException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma Error:', error);
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: 'prisma_error',
          prismaError: error,
          status: 404,
        });
      }
      throw error.message;
    }
  }
  /**
   * Delete a role from the database based on its ID.
   *
   * @param id - The ID of the role to delete.
   * @returns A promise that resolves to the deleted role.
   * @throws CustomErrorException if the role is not deleted.
   */
  async deleteRole(id: string) {
    try {
      const role = await this.prisma.role.delete({
        where: {
          id,
        },
      });

      if (!role)
        throw new CustomErrorException({
          errorType: 'Role',
          value: id,
          errorCase: 'role_not_deleted',
          status: 404,
        });

      return role;
    } catch (error) {
      console.log(error.message);
      if (error instanceof CustomErrorException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log('Prisma Error:', error);
        throw new CustomErrorException({
          errorType: 'Role',
          errorCase: 'prisma_error',
          prismaError: error,
          status: 404,
        });
      }
      throw error.message;
    }
  }
}
