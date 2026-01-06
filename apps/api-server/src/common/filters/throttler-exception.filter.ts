import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorResponse } from './error-codes';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ThrottlerExceptionFilter.name);

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const errorResponse: ErrorResponse = {
      statusCode: 429,
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests, please try again later',
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`Rate limit exceeded: [${request.method}] ${request.url} - IP: ${request.ip}`);

    response.status(errorResponse.statusCode).send(errorResponse);
  }
}
