import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthResponse } from '../src/auth/contracts/auth.contract';
import { PrismaService } from '../src/database/prisma.service';
import type {
  NotificationReadAllResponse,
  NotificationResponse,
  NotificationUnreadCountResponse,
} from '../src/domain/contracts';
import type { NotificationListResponse } from '../src/notifications/contracts/notification-list.contract';
import { configureApplication } from '../src/setup-app';
import { NotificationType } from '../src/generated/prisma/client';

interface RegisteredUser {
  accessToken: string;
  user: AuthResponse['user'];
}

describe('Notifications API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const adminEmail = `notifications-admin-${unique}@example.com`;
  const otherEmail = `notifications-other-${unique}@example.com`;
  const password = 'Password123!';
  let admin: RegisteredUser;
  let other: RegisteredUser;
  let unreadNotificationId: string;
  let readNotificationId: string;
  let otherNotificationId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    prisma = app.get(PrismaService);
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];

    admin = await registerUser(adminEmail, 'Notifications Admin');
    other = await registerUser(otherEmail, 'Notifications Other');

    const unread = await prisma.notification.create({
      data: {
        recipientId: admin.user.id,
        type: NotificationType.TASK_ASSIGNED,
      },
    });
    unreadNotificationId = unread.id;

    const read = await prisma.notification.create({
      data: {
        readAt: new Date(),
        recipientId: admin.user.id,
        type: NotificationType.TASK_COMMENTED,
      },
    });
    readNotificationId = read.id;

    const otherNotification = await prisma.notification.create({
      data: {
        recipientId: other.user.id,
        type: NotificationType.PROJECT_MEMBER_ADDED,
      },
    });
    otherNotificationId = otherNotification.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: {
        id: {
          in: [unreadNotificationId, readNotificationId, otherNotificationId],
        },
      },
    });
    await prisma.refreshSession.deleteMany({
      where: { user: { email: { in: [adminEmail, otherEmail] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, otherEmail] } },
    });
    await app.close();
  });

  it('requires authentication', async () => {
    await request(server).get('/api/v1/notifications').expect(401);
    await request(server).get('/api/v1/notifications/unread-count').expect(401);
  });

  it('lists only current-user notifications newest first', async () => {
    await request(server)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as NotificationListResponse;
        expect(response.data.map((item) => item.id)).toEqual([
          readNotificationId,
          unreadNotificationId,
        ]);
        expect(
          response.data.some((item) => item.id === otherNotificationId),
        ).toBe(false);
        expect(response.meta.total).toBe(2);
        expect(response.data[0]).not.toHaveProperty('title');
        expect(response.data[0]).not.toHaveProperty('message');
        expect(response.data[0]).not.toHaveProperty('fallbackMessage');
      });
  });

  it('filters unread notifications and returns unread count', async () => {
    await request(server)
      .get('/api/v1/notifications')
      .query({ unread: 'true' })
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as NotificationListResponse;
        expect(response.data).toHaveLength(1);
        expect(response.data[0].id).toBe(unreadNotificationId);
      });

    await request(server)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as NotificationUnreadCountResponse).count).toBe(1);
      });
  });

  it('marks one current-user notification as read idempotently', async () => {
    await request(server)
      .post(`/api/v1/notifications/${unreadNotificationId}/read`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as NotificationResponse;
        expect(response.id).toBe(unreadNotificationId);
        expect(response.readAt).toEqual(expect.any(String));
      });

    await request(server)
      .post(`/api/v1/notifications/${unreadNotificationId}/read`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as NotificationResponse).id).toBe(unreadNotificationId);
      });
  });

  it('does not allow marking another user notification as read', async () => {
    await request(server)
      .post(`/api/v1/notifications/${otherNotificationId}/read`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(404);
  });

  it('marks all current-user notifications as read without touching others', async () => {
    await prisma.notification.update({
      data: { readAt: null },
      where: { id: unreadNotificationId },
    });

    await request(server)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as NotificationReadAllResponse).updatedCount).toBe(1);
      });

    const otherNotification = await prisma.notification.findUniqueOrThrow({
      where: { id: otherNotificationId },
    });
    expect(otherNotification.readAt).toBeNull();
  });

  async function registerUser(
    email: string,
    displayName: string,
  ): Promise<RegisteredUser> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ displayName, email, password })
      .expect(201);
    const body = response.body as AuthResponse;
    return { accessToken: body.accessToken, user: body.user };
  }
});
