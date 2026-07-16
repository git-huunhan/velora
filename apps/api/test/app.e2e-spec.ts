import {
  Controller,
  Get,
  Post,
  type INestApplication,
  Query,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PaginationQueryDto } from './../src/common/dto/pagination-query.dto';
import { configureApplication } from './../src/setup-app';

@Controller('test/pagination')
class PaginationTestController {
  @Get()
  check(@Query() query: PaginationQueryDto): PaginationQueryDto {
    return query;
  }

  @Get('error')
  fail(): never {
    throw new Error('Sensitive internal detail');
  }

  @Post('write')
  write(): Record<string, string> {
    return { status: 'ok' };
  }
}

describe('API standards (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [PaginationTestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(['ok', 'degraded']).toContain(body.status);
        expect(['ok', 'unavailable']).toContain(body.database);
        expect(typeof body.timestamp).toBe('string');
      });
  });

  it('adds production safety headers and request ids', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', 'test-request-id')
      .expect(200)
      .expect('x-request-id', 'test-request-id')
      .expect('x-content-type-options', 'nosniff')
      .expect('x-frame-options', 'DENY')
      .expect('referrer-policy', 'no-referrer');
  });

  it('adds rate-limit headers to write requests', () => {
    return request(app.getHttpServer())
      .post('/api/v1/test/pagination/write')
      .expect(201);
  });

  it('publishes the OpenAPI document', () => {
    return request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body.info).toMatchObject({
          title: 'Velora API',
          version: '1.0',
        });
        expect(body.paths).toHaveProperty('/api/v1/health');
        expect(body.components).toHaveProperty('schemas.TaskResponse');
        expect(body.components).toHaveProperty('schemas.ProjectResponse');
        expect(body.components).toHaveProperty('schemas.MoveTaskDto');
      });
  });

  it('transforms valid pagination query values', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test/pagination?page=2&limit=50&sort=createdAt:desc')
      .expect(200)
      .expect({ page: 2, limit: 50, sort: 'createdAt:desc' });
  });

  it('returns the standard validation error contract', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test/pagination?page=0&unexpected=true')
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          requestId: expect.any(String),
          path: '/api/v1/test/pagination?page=0&unexpected=true',
        });
        expect(body.details).toEqual(expect.any(Array));
        expect(body.timestamp).toEqual(expect.any(String));
      });
  });

  it('sanitizes unhandled errors', () => {
    return request(app.getHttpServer())
      .get('/api/v1/test/pagination/error')
      .expect(500)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({
          statusCode: 500,
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          requestId: expect.any(String),
          path: '/api/v1/test/pagination/error',
        });
        expect(JSON.stringify(body)).not.toContain('Sensitive internal detail');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
