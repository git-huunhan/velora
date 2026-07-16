import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { ApiErrorResponse } from '../contracts/api-error.contract';

interface NestErrorBody {
  error?: string;
  message?: string | string[];
}

interface HttpRequestWithRequestId {
  headers: Record<string, string | string[] | undefined>;
  requestId?: string;
}

const BAD_REQUEST_STATUS = 400;
const INTERNAL_SERVER_ERROR_STATUS = 500;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : Number(HttpStatus.INTERNAL_SERVER_ERROR);
    const exceptionBody = this.getExceptionBody(exception);
    const request = context.getRequest<HttpRequestWithRequestId>();
    const path = httpAdapter.getRequestUrl(request) as string;
    const requestId = this.getRequestId(request);
    const responseBody: ApiErrorResponse = {
      statusCode,
      code: this.getErrorCode(statusCode, exceptionBody),
      message: this.getMessage(statusCode, exceptionBody),
      timestamp: new Date().toISOString(),
      requestId,
      path,
    };

    if (Array.isArray(exceptionBody.message)) {
      responseBody.details = exceptionBody.message;
    }

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled exception requestId=${requestId ?? 'unknown'} path=${path}`,
        exception,
      );
    }

    httpAdapter.reply(context.getResponse(), responseBody, statusCode);
  }

  private getRequestId(request: HttpRequestWithRequestId): string | undefined {
    const header = request.headers['x-request-id'];
    if (typeof header === 'string' && header.trim()) {
      return header;
    }

    return request.requestId;
  }

  private getExceptionBody(exception: unknown): NestErrorBody {
    if (!(exception instanceof HttpException)) {
      return {};
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { message: response };
    }

    const body = response as Record<string, unknown>;
    const error = typeof body.error === 'string' ? body.error : undefined;
    const message = this.parseMessage(body.message);

    return { error, message };
  }

  private parseMessage(value: unknown): string | string[] | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      return value;
    }

    return undefined;
  }

  private getErrorCode(statusCode: number, body: NestErrorBody): string {
    if (statusCode === BAD_REQUEST_STATUS && Array.isArray(body.message)) {
      return 'VALIDATION_ERROR';
    }

    if (body.error) {
      return body.error.toUpperCase().replaceAll(/[^A-Z0-9]+/g, '_');
    }

    return statusCode === INTERNAL_SERVER_ERROR_STATUS
      ? 'INTERNAL_SERVER_ERROR'
      : `HTTP_${statusCode}`;
  }

  private getMessage(statusCode: number, body: NestErrorBody): string {
    if (Array.isArray(body.message)) {
      return 'Request validation failed';
    }

    if (body.message) {
      return body.message;
    }

    return statusCode === INTERNAL_SERVER_ERROR_STATUS
      ? 'An unexpected error occurred'
      : 'Request failed';
  }
}
