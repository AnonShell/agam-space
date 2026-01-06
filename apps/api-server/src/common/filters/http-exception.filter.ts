import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, ErrorResponse } from './error-codes';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = this.buildErrorResponse(exceptionResponse, status, request.url);

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url}`, exception.stack);
    } else if (status >= 400) {
      this.logger.debug(`[${request.method}] ${request.url} - ${errorResponse.message}`);
    }

    response.status(status).send(errorResponse);
  }

  private buildErrorResponse(
    exceptionResponse: string | object,
    status: number,
    path: string
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const defaultCode = status >= 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.BAD_REQUEST;

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode: status,
        code: defaultCode,
        message: exceptionResponse,
        path,
        timestamp,
      };
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      return {
        statusCode: status,
        code: (resp.code as string) || defaultCode,
        message: (resp.message as string) || 'An error occurred',
        ...(resp.details && { details: resp.details }),
        path,
        timestamp,
      };
    }

    return {
      statusCode: status,
      code: defaultCode,
      message: 'An error occurred',
      path,
      timestamp,
    };
  }
}
