import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, ErrorResponse } from './error-codes';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResponse = this.buildErrorResponse(exception, request.url);

    this.logger.error(
      `Unexpected error: [${request.method}] ${request.url}`,
      exception instanceof Error ? exception.stack : exception
    );

    response.status(errorResponse.statusCode).send(errorResponse);
  }

  private buildErrorResponse(exception: unknown, path: string): ErrorResponse {
    const errorMessage = exception instanceof Error ? exception.message : 'Internal Server Error';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: errorMessage,
      path,
      timestamp: new Date().toISOString(),
    };
  }
}
