import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthResponse } from '../src/auth/contracts/auth.contract';
import { PrismaService } from '../src/database/prisma.service';
import type { ProjectResponse } from '../src/domain/contracts';
import type { ProjectListResponse } from '../src/projects/contracts/project-list.contract';
import { configureApplication } from '../src/setup-app';

describe('Projects API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const ownerEmail = `project-owner-${unique}@example.com`;
  const outsiderEmail = `project-outsider-${unique}@example.com`;
  const key = `P${String(unique).slice(-8)}`;
  const password = 'Password123!';
  let ownerToken: string;
  let outsiderToken: string;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    prisma = app.get(PrismaService);
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];

    ownerToken = await registerAndGetAccessToken(ownerEmail, 'Project Owner');
    outsiderToken = await registerAndGetAccessToken(
      outsiderEmail,
      'Project Outsider',
    );
  });

  afterAll(async () => {
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    await prisma.refreshSession.deleteMany({
      where: {
        user: { email: { in: [ownerEmail, outsiderEmail] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, outsiderEmail] } },
    });
    await app.close();
  });

  it('creates a project with owner membership and default columns', async () => {
    const createResponse = await request(server)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Project integration test',
        key,
        name: 'Project Integration',
      })
      .expect(201);
    const project = createResponse.body as ProjectResponse;
    projectId = project.id;

    expect(project).toMatchObject({
      description: 'Project integration test',
      key,
      name: 'Project Integration',
      status: 'active',
    });

    const stored = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { columns: true, members: true },
    });
    expect(stored.members).toHaveLength(1);
    expect(stored.members[0].role).toBe('OWNER');
    expect(stored.columns.map((column) => column.name).sort()).toEqual([
      'Done',
      'In Progress',
      'Review',
      'To Do',
    ]);
  });

  it('lists, reads, updates, archives, and unarchives visible projects', async () => {
    await request(server)
      .get('/api/v1/projects')
      .query({ search: key, sort: 'key:asc' })
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as ProjectListResponse;
        expect(response.data).toHaveLength(1);
        expect(response.data[0].id).toBe(projectId);
        expect(response.meta.total).toBe(1);
      });

    await request(server)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as ProjectResponse).key).toBe(key);
      });

    await request(server)
      .patch(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Updated project integration test',
        name: 'Updated Project Integration',
        status: 'planning',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          description: 'Updated project integration test',
          name: 'Updated Project Integration',
          status: 'planning',
        });
      });

    await request(server)
      .post(`/api/v1/projects/${projectId}/archive`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as ProjectResponse).archivedAt).toEqual(
          expect.any(String),
        );
      });

    await request(server)
      .post(`/api/v1/projects/${projectId}/unarchive`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as ProjectResponse).archivedAt).toBeNull();
      });
  });

  it('rejects duplicate keys and blocks non-members', async () => {
    await request(server)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ key, name: 'Duplicate Project' })
      .expect(409);

    await request(server)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  async function registerAndGetAccessToken(
    email: string,
    displayName: string,
  ): Promise<string> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ displayName, email, password })
      .expect(201);
    return (response.body as AuthResponse).accessToken;
  }
});
