import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type ErrorType = 'User' | 'Role' | 'Permission' | 'RoleSystem' | 'Post' | 'Other' | 'Resource';

export const errorCases = {
  USER_NOT_UPDATED: 'user_not_updated',
  USER_NOT_FOUND: 'user_not_found',
  USER_NOT_DELETED: 'user_not_deleted',
  ROLE_NOT_UPDATED: 'role_not_updated',
  ROLE_NOT_DELETED: 'role_not_deleted',
  USER_NOT_CREATED: 'user_not_created',
  USER_ALREADY_EXIST: 'user_already_exist',
  ROLE_NOT_CREATED: 'role_not_created',
  ROLE_ALREADY_EXIST: 'role_already_exist',
  ROLE_NOT_FOUND: 'role_not_found',
  POST_ALREADY_EXISTS: 'post_already_exists',
  USER_WITHOUT_ENOUGH_PERMISSION: 'user_without_enough_permission',
  POST_NOT_CREATED: 'post_not_created',
  PERMISSION_NOT_FOUND: 'permission_not_found',
  POST_NOT_FOUND: 'post_not_found',
  PRISMA_ERROR: 'prisma_error',
  RESOURCE_NOT_FOUND: 'resource_not_found',
  RESOURCE_NOT_UPDATED: 'resource_not_updated',
  INVALID_LIMIT: 'invalid_limit',
};

interface IHandler {
  errorType: ErrorType;
  errorCase: string;
  value?: string | number;
  status?: number;
  prismaError?: Prisma.PrismaClientKnownRequestError;
}

export class CustomErrorException extends HttpException {
  constructor({
    errorType,
    errorCase,
    value,
    prismaError,
    status = HttpStatus.NOT_FOUND,
  }: IHandler) {
    let message = `${errorType} with ${value} was not successfully fulfilled, ${errorCase}`;

    if (prismaError) {
      message = `Error in ${errorType} operation: ${prismaError.meta?.message}`;
    }
    super(message, status);
  }
}

export class PostNotFoundError extends CustomErrorException {
  constructor(value?: IHandler['value'], prismaError?: IHandler['prismaError']) {
    super({
      value,
      errorCase: errorCases.POST_NOT_FOUND,
      errorType: 'Post',
      prismaError: prismaError,
    });
  }
}

export class UserErrorHandler extends CustomErrorException {
  constructor(
    value?: IHandler['value'],
    prismaError?: IHandler['prismaError'],
    errorCase?: IHandler['errorCase'],
  ) {
    super({
      value,
      errorCase,
      errorType: 'User',
      prismaError: prismaError,
    });
  }
}
