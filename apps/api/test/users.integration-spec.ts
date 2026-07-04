import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthResponse } from '../src/auth/contracts/auth.contract';
import { PrismaService } from '../src/database/prisma.service';
import type { UserListResponse } from '../src/users/contracts/user-list.contract';
import { configureApplication } from '../src/setup-app';

describe('Users API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const email = `users-${unique}@example.com`;
  const password = 'Password123!';
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    prisma = app.get(PrismaService);
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Users Integration',
        email,
        password,
      })
      .expect(201);
    accessToken = (response.body as AuthResponse).accessToken;
  });

  afterAll(async () => {
    await prisma.refreshSession.deleteMany({
      where: { user: { email: { startsWith: `users-${unique}` } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: `users-${unique}` } },
    });
    await app.close();
  });

  it('returns and updates the current user profile', async () => {
    await request(server)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as Record<string, unknown>;
        expect(body).toMatchObject({
          email,
          name: 'Users Integration',
          role: 'user',
        });
        expect(response.passwordHash).toBeUndefined();
        expect(response.sessions).toBeUndefined();
      });

    await request(server)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        avatarUrl: 'https://avatars.local/user.png',
        displayName: 'Updated User',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          avatarUrl: 'https://avatars.local/user.png',
          email,
          name: 'Updated User',
        });
      });
  });

  it('lists searchable users for pickers', async () => {
    await request(server)
      .get('/api/v1/users')
      .query({ search: `users-${unique}`, sort: 'name:asc' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as UserListResponse;
        expect(response.data).toHaveLength(1);
        expect(response.data[0]).toMatchObject({
          email,
          name: 'Updated User',
        });
        expect(response.meta.total).toBe(1);
        expect(response.data[0].passwordHash).toBeUndefined();
      });
  });

  it('requires authentication', async () => {
    await request(server).get('/api/v1/users/me').expect(401);
    await request(server).get('/api/v1/users').expect(401);
  });
});
