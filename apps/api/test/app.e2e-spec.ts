import { Controller, Get, type INestApplication, Query } from '@nestjs/common';
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
        expect(body.status).toBe('ok');
        expect(typeof body.timestamp).toBe('string');
      });
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
          path: '/api/v1/test/pagination/error',
        });
        expect(JSON.stringify(body)).not.toContain('Sensitive internal detail');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
