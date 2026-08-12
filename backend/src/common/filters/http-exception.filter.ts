import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : exception instanceof Error
          ? exception.message
          : 'Erro interno';

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[correlationId=${request.correlationId}] ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      correlationId: request.correlationId,
    });
  }
}
