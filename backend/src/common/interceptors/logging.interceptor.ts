import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const { method, originalUrl, correlationId } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(method, originalUrl, response.statusCode, start, correlationId),
        error: (error: { status?: number }) =>
          this.log(method, originalUrl, error.status ?? 500, start, correlationId),
      }),
    );
  }

  private log(
    method: string,
    url: string,
    statusCode: number,
    start: number,
    correlationId: string,
  ) {
    const durationMs = Date.now() - start;
    this.logger.log(
      `${method} ${url} ${statusCode} +${durationMs}ms [correlationId=${correlationId}]`,
    );
  }
}
