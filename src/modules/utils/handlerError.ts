import { HttpException, HttpStatus } from '@nestjs/common';

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
  | 'user_without_enough_permission';

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
