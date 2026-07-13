import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthResponse } from '../src/auth/contracts/auth.contract';
import { PrismaService } from '../src/database/prisma.service';
import type {
  KanbanColumnResponse,
  ProjectResponse,
  TaskResponse,
} from '../src/domain/contracts';
import { NotificationType } from '../src/generated/prisma/client';
import type { KanbanColumnListResponse } from '../src/projects/contracts/kanban-column-list.contract';
import { configureApplication } from '../src/setup-app';

interface RegisteredUser {
  accessToken: string;
  user: AuthResponse['user'];
}

describe('Notification triggers integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const ownerEmail = `notification-trigger-owner-${unique}@example.com`;
  const memberEmail = `notification-trigger-member-${unique}@example.com`;
  const password = 'Password123!';
  const key = `NT${String(unique).slice(-7)}`;
  let owner: RegisteredUser;
  let member: RegisteredUser;
  let projectId: string;
  let todoColumn: KanbanColumnResponse;
  let inProgressColumn: KanbanColumnResponse;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApplication(app);
    prisma = app.get(PrismaService);
    await app.init();
    server = app.getHttpServer() as Parameters<typeof request>[0];

    owner = await registerUser(ownerEmail, 'Notification Owner');
    member = await registerUser(memberEmail, 'Notification Member');

    const projectResponse = await request(server)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ key, name: 'Notification Trigger Project' })
      .expect(201);
    projectId = (projectResponse.body as ProjectResponse).id;

    const columnsResponse = await request(server)
      .get(`/api/v1/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const columns = (columnsResponse.body as KanbanColumnListResponse).data;
    todoColumn = columns[0];
    inProgressColumn = columns[1];
  });

  afterAll(async () => {
    if (projectId) {
      await prisma.project.deleteMany({ where: { id: projectId } });
    }
    await prisma.refreshSession.deleteMany({
      where: { user: { email: { in: [ownerEmail, memberEmail] } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, memberEmail] } },
    });
    await app.close();
  });

  it('notifies a user when they are added to a project', async () => {
    await request(server)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ role: 'member', userId: member.user.id })
      .expect(201);

    await expectNotification(
      member.user.id,
      NotificationType.PROJECT_MEMBER_ADDED,
      {
        actorId: owner.user.id,
        projectId,
      },
    );
    await expectNoNotification(
      owner.user.id,
      NotificationType.PROJECT_MEMBER_ADDED,
    );
  });

  it('notifies the assigned user without notifying the actor', async () => {
    await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        assigneeId: owner.user.id,
        columnId: todoColumn.id,
        title: 'Self assigned task',
        type: 'task',
      })
      .expect(201);

    await expectNoNotification(owner.user.id, NotificationType.TASK_ASSIGNED);

    const taskResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        assigneeId: member.user.id,
        columnId: todoColumn.id,
        title: 'Assigned trigger task',
        type: 'task',
      })
      .expect(201);
    const task = taskResponse.body as TaskResponse;

    await expectNotification(member.user.id, NotificationType.TASK_ASSIGNED, {
      actorId: owner.user.id,
      projectId,
      taskId: task.id,
    });
  });

  it('notifies related users for comments and status changes', async () => {
    const taskResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        assigneeId: member.user.id,
        columnId: todoColumn.id,
        title: 'Comment and status trigger task',
        type: 'task',
      })
      .expect(201);
    let task = taskResponse.body as TaskResponse;

    await request(server)
      .post(`/api/v1/projects/${projectId}/tasks/${task.id}/comments`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ body: 'Comment from assignee.' })
      .expect(201);

    await expectNotification(owner.user.id, NotificationType.TASK_COMMENTED, {
      actorId: member.user.id,
      projectId,
      taskId: task.id,
    });
    await expectNoNotification(member.user.id, NotificationType.TASK_COMMENTED);

    const moveResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks/${task.id}/move`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        expectedUpdatedAt: task.updatedAt,
        targetColumnId: inProgressColumn.id,
      })
      .expect(200);
    task = moveResponse.body as TaskResponse;

    await expectNotification(
      member.user.id,
      NotificationType.TASK_STATUS_CHANGED,
      {
        actorId: owner.user.id,
        projectId,
        taskId: task.id,
      },
    );
    await expectNoNotification(
      owner.user.id,
      NotificationType.TASK_STATUS_CHANGED,
    );
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

  async function expectNotification(
    recipientId: string,
    type: NotificationType,
    expected: {
      actorId?: string;
      projectId?: string;
      taskId?: string;
    } = {},
  ): Promise<void> {
    await expect(
      prisma.notification.findFirst({
        where: { recipientId, type, ...expected },
      }),
    ).resolves.toEqual(expect.objectContaining({ recipientId, type }));
  }

  async function expectNoNotification(
    recipientId: string,
    type: NotificationType,
  ): Promise<void> {
    await expect(
      prisma.notification.findFirst({ where: { recipientId, type } }),
    ).resolves.toBeNull();
  }
});
