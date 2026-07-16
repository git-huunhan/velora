import {
  ClassSerializerInterceptor,
  HttpStatus,
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { configureSwagger } from './config/swagger';

interface RequestWithRequestId extends Request {
  requestId?: string;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function configureApplication(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const rateLimitWindowMs = configService.get<number>(
    'API_RATE_LIMIT_WINDOW_MS',
    60_000,
  );
  const rateLimitMax = configService.get<number>('API_RATE_LIMIT_MAX', 600);

  app.use(createRequestIdMiddleware());
  app.enableCors({
    allowedHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: getCorsOrigins(configService),
  });
  app.use(createRateLimitMiddleware(rateLimitWindowMs, rateLimitMax));
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  configureSwagger(app);
}

function createRequestIdMiddleware() {
  return (
    request: RequestWithRequestId,
    response: Response,
    next: NextFunction,
  ) => {
    const incomingRequestId = request.header('x-request-id')?.trim();
    const requestId = incomingRequestId || randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('referrer-policy', 'no-referrer');
    next();
  };
}

function createRateLimitMiddleware(windowMs: number, maxRequests: number) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      next();
      return;
    }

    const now = Date.now();
    cleanupExpiredRateLimitBuckets(now);

    const bucketKey = `${request.ip ?? 'unknown'}:${request.path}`;
    const currentBucket = rateLimitBuckets.get(bucketKey);
    const bucket =
      currentBucket && currentBucket.resetAt > now
        ? currentBucket
        : { count: 0, resetAt: now + windowMs };

    bucket.count += 1;
    rateLimitBuckets.set(bucketKey, bucket);

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );
    response.setHeader('x-ratelimit-limit', String(maxRequests));
    response.setHeader(
      'x-ratelimit-remaining',
      String(Math.max(0, maxRequests - bucket.count)),
    );
    response.setHeader('x-ratelimit-reset', String(bucket.resetAt));

    if (bucket.count > maxRequests) {
      response.setHeader('retry-after', String(retryAfterSeconds));
      response.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please wait a moment.',
        timestamp: new Date().toISOString(),
        requestId: response.getHeader('x-request-id'),
        path: request.originalUrl,
      });
      return;
    }

    next();
  };
}

function cleanupExpiredRateLimitBuckets(now: number): void {
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function getCorsOrigins(configService: ConfigService) {
  const configuredOrigin = configService.get<string>('CORS_ORIGIN');
  if (configuredOrigin) {
    return configuredOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  return [/^http:\/\/localhost:\d+$/];
}
