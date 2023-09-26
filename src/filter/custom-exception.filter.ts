import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { CustomErrorException } from '../../src/modules/utils';
import { Request, Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof CustomErrorException) {
      const customStatus = exception.getStatus();

      const { message } = exception;
      return response.status(customStatus).json({
        message,
        status: customStatus,
      });
    }

    response.status(status).json({
      message: 'Internal Server Error',
      status,
    });
  }
}
