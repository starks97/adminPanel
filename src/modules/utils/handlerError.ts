import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type ErrorType = 'User' | 'Role' | 'Permission' | 'RoleSystem' | 'Post';

type ErrorCases =
  | 'user_not_updated'
  | 'user_not_found'
  | 'user_not_deleted'
  | 'role_not_updated'
  | 'role_not_deleted'
  | 'user_not_created'
  | 'user_already_exist'
  | 'role_not_created'
  | 'role_already_exist'
  | 'role_not_found'
  | 'post_already_exists'
  | 'user_without_enough_permission'
  | 'post_not_created'
  | 'permission_not_found'
  | 'post_not_found'
  | 'prisma_error';

interface IHandler {
  errorType: ErrorType;
  errorCase: ErrorCases;
  value?: string;
  prismaError?: Prisma.PrismaClientKnownRequestError;
}

export class CustomErrorException extends HttpException {
  constructor({ errorType, errorCase, value, prismaError }: IHandler) {
    let message = `${errorType} with ${value} was not successfully fulfilled, ${errorCase}`;

    if (prismaError) {
      message = `Error in ${errorType} operation: ${prismaError.meta?.message}`;
      errorCase = 'prisma_error';
    }
    super(message, HttpStatus.NOT_FOUND);
  }
}
