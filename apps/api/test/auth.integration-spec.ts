import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApplication } from '../src/setup-app';
import { PrismaService } from '../src/database/prisma.service';
import type {
  AuthResponse,
  AuthTokensResponse,
} from '../src/auth/contracts/auth.contract';
import type { UserResponse } from '../src/domain/contracts';

describe('Auth API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const email = `auth-${unique}@example.com`;
  const password = 'Password123!';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    prisma = app.get(PrismaService);
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];
  });

  afterAll(async () => {
    await prisma.refreshSession.deleteMany({
      where: { user: { email: { startsWith: `auth-${unique}` } } },
    });
    await prisma.user.deleteMany({
      where: { email: { startsWith: `auth-${unique}` } },
    });
    await app.close();
  });

  it('registers, reads the current user, refreshes, logs out, and rejects reused refresh tokens', async () => {
    const registerResponse = await request(server)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Auth Integration',
        email,
        password,
      })
      .expect(201);
    const registered = registerResponse.body as AuthResponse;

    expect(registered.user).toMatchObject({
      email,
      name: 'Auth Integration',
      role: 'user',
    });
    expect(registered.accessToken).toEqual(expect.any(String));
    expect(registered.refreshToken).toEqual(expect.any(String));

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registered.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as UserResponse).email).toBe(email);
      });

    const refreshResponse = await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: registered.refreshToken })
      .expect(200);
    const refreshed = refreshResponse.body as AuthTokensResponse;

    expect(refreshed.accessToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).toEqual(expect.any(String));
    expect(refreshed.refreshToken).not.toBe(registered.refreshToken);

    await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: registered.refreshToken })
      .expect(401);

    await request(server)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refreshed.refreshToken })
      .expect(204);

    await request(server)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refreshed.refreshToken })
      .expect(401);
  });

  it('rejects invalid credentials', async () => {
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });
});
