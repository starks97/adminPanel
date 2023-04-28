import { HttpException, HttpStatus } from '@nestjs/common';

type ErrorType = 'User' | 'Role' | 'Permission' | 'RoleSystem';

type ErrorCases =
  | 'user_not_updated'
  | 'user_not_deleted'
  | 'role_not_updated'
  | 'role_not_deleted'
  | 'user_not_created'
  | 'user_already_exist'
  | 'role_not_created'
  | 'role_already_exist'
  | 'role_not_found';

interface IHandler {
  errorType: ErrorType;
  errorCase: ErrorCases;
  value?: string;
}

export class CustomErrorException extends HttpException {
  constructor({ errorType, errorCase, value }: IHandler) {
    super(
      `${errorType} with ${value} was not successfully fulfilled, ${errorCase}`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class RoleNotFoundException extends HttpException {
  constructor(roleName: string) {
    super(`Role ${roleName} not found`, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}
