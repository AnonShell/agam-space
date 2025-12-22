import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? exception.getResponse()
      : ((exception as Error)?.message ?? 'Internal Server Error');

    const error =
      typeof message === 'string' ? message : (message as any).message || 'Unexpected error';

    console.error(`[${request.method}] ${request.url}`, exception);

    response.status(status).send({
      statusCode: status,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
