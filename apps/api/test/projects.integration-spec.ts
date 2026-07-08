import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthResponse } from '../src/auth/contracts/auth.contract';
import { PrismaService } from '../src/database/prisma.service';
import type {
  ActivityResponse,
  CommentResponse,
  KanbanColumnResponse,
  ProjectMemberResponse,
  ProjectResponse,
  TaskResponse,
} from '../src/domain/contracts';
import type { ActivityListResponse } from '../src/projects/contracts/activity-list.contract';
import type { CommentListResponse } from '../src/projects/contracts/comment-list.contract';
import type { KanbanColumnListResponse } from '../src/projects/contracts/kanban-column-list.contract';
import type { ProjectListResponse } from '../src/projects/contracts/project-list.contract';
import type { ProjectMemberListResponse } from '../src/projects/contracts/project-member-list.contract';
import type { TaskListResponse } from '../src/projects/contracts/task-list.contract';
import { configureApplication } from '../src/setup-app';

describe('Projects API integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Parameters<typeof request>[0];

  const unique = Date.now();
  const ownerEmail = `project-owner-${unique}@example.com`;
  const memberEmail = `project-member-${unique}@example.com`;
  const outsiderEmail = `project-outsider-${unique}@example.com`;
  const key = `P${String(unique).slice(-8)}`;
  const password = 'Password123!';
  let ownerToken: string;
  let memberToken: string;
  let memberUserId: string;
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
    const member = await registerUser(memberEmail, 'Project Member');
    memberToken = member.accessToken;
    memberUserId = member.user.id;
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
        user: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } },
      },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, memberEmail, outsiderEmail] } },
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

  it('manages workflow columns for project managers', async () => {
    const listResponse = await request(server)
      .get(`/api/v1/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const defaultColumns = (listResponse.body as KanbanColumnListResponse).data;
    expect(defaultColumns.map((column) => column.name)).toEqual([
      'To Do',
      'In Progress',
      'Review',
      'Done',
    ]);

    const createResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Blocked' })
      .expect(201);
    const created = createResponse.body as KanbanColumnResponse;
    expect(created).toMatchObject({ isDone: false, name: 'Blocked' });

    await request(server)
      .post(`/api/v1/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Blocked' })
      .expect(409);

    const updateResponse = await request(server)
      .patch(`/api/v1/projects/${projectId}/columns/${created.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isDone: true, name: 'QA Blocked' })
      .expect(200);
    const updated = updateResponse.body as KanbanColumnResponse;
    expect(updated).toMatchObject({ isDone: true, name: 'QA Blocked' });

    await request(server)
      .post(`/api/v1/projects/${projectId}/columns/${updated.id}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        afterColumnId: defaultColumns[0].id,
        expectedUpdatedAt: updated.updatedAt,
      })
      .expect(200);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/columns/${updated.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
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

  it('creates, lists, updates, and deletes hierarchical tasks', async () => {
    const columnsResponse = await request(server)
      .get(`/api/v1/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const todoColumn = (columnsResponse.body as KanbanColumnListResponse)
      .data[0];

    const epicResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumn.id,
        title: 'Project integration epic',
        type: 'epic',
      })
      .expect(201);
    const epic = epicResponse.body as TaskResponse;
    expect(epic).toMatchObject({
      parentId: null,
      title: 'Project integration epic',
      type: 'epic',
    });

    await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumn.id,
        title: 'Invalid orphan subtask',
        type: 'subtask',
      })
      .expect(400);

    const taskResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumn.id,
        labels: ['Backend', 'Backend', ' API '],
        parentId: epic.id,
        priority: 'high',
        title: 'Build task API',
        type: 'task',
      })
      .expect(201);
    let task = taskResponse.body as TaskResponse;
    expect(task).toMatchObject({
      labels: ['Backend', 'API'],
      parentId: epic.id,
      priority: 'high',
      title: 'Build task API',
      type: 'task',
    });

    const subtaskResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumn.id,
        parentId: task.id,
        title: 'Wire task mapper',
        type: 'subtask',
      })
      .expect(201);
    const subtask = subtaskResponse.body as TaskResponse;
    expect(subtask.parentId).toBe(task.id);

    const commentResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks/${task.id}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ body: 'Looks good for the first backend pass.' })
      .expect(201);
    const comment = commentResponse.body as CommentResponse;
    expect(comment).toMatchObject({
      body: 'Looks good for the first backend pass.',
      taskId: task.id,
    });
    expect(comment.author.name).toBe('Project Owner');

    await request(server)
      .get(`/api/v1/projects/${projectId}/tasks/${task.id}/comments`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as CommentListResponse;
        expect(response.data.map((item) => item.id)).toContain(comment.id);
      });

    await request(server)
      .get(`/api/v1/projects/${projectId}/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect((body as TaskResponse).code).toBe(task.code);
      });

    await request(server)
      .get(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as TaskListResponse;
        expect(response.data.map((item) => item.id)).toEqual(
          expect.arrayContaining([epic.id, task.id, subtask.id]),
        );
      });

    const updateResponse = await request(server)
      .patch(`/api/v1/projects/${projectId}/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        description: 'Updated task description',
        dueDate: '2026-08-01T00:00:00.000Z',
        priority: 'medium',
        title: 'Build task CRUD API',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          description: 'Updated task description',
          dueDate: '2026-08-01T00:00:00.000Z',
          priority: 'medium',
          title: 'Build task CRUD API',
        });
      });
    const updatedTask = updateResponse.body as TaskResponse;
    task = updatedTask;

    const inProgressColumn = (columnsResponse.body as KanbanColumnListResponse)
      .data[1];

    const moveResponse = await request(server)
      .post(`/api/v1/projects/${projectId}/tasks/${task.id}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedUpdatedAt: task.updatedAt,
        targetColumnId: inProgressColumn.id,
        targetParentId: epic.id,
      })
      .expect(200);
    task = moveResponse.body as TaskResponse;
    expect(task).toMatchObject({
      columnId: inProgressColumn.id,
      parentId: epic.id,
    });

    await request(server)
      .get(`/api/v1/projects/${projectId}/tasks/${task.id}/activities`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as ActivityListResponse;
        const fields = response.data.map(
          (activity: ActivityResponse) => activity.field,
        );
        expect(fields).toEqual(
          expect.arrayContaining([
            'created',
            'commented',
            'title',
            'description',
            'priority',
            'dueDate',
            'columnId',
            'rank',
          ]),
        );
      });

    await request(server)
      .post(`/api/v1/projects/${projectId}/tasks/${task.id}/move`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedUpdatedAt: updatedTask.updatedAt,
        targetColumnId: todoColumn.id,
        targetParentId: epic.id,
      })
      .expect(409);

    await request(server)
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        columnId: todoColumn.id,
        priority: 'medium',
        title: 'Create after a task leaves the column',
        type: 'bug',
      })
      .expect(201);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/tasks/${subtask.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/tasks/${epic.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
  });

  it('manages project members and protects the final owner', async () => {
    await request(server)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'viewer', userId: memberUserId })
      .expect(201)
      .expect(({ body }) => {
        const member = body as ProjectMemberResponse;
        expect(member.role).toBe('viewer');
        expect(member.user.id).toBe(memberUserId);
      });

    await request(server)
      .get(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200)
      .expect(({ body }) => {
        const response = body as ProjectMemberListResponse;
        expect(response.data.map((member) => member.user.id)).toContain(
          memberUserId,
        );
      });

    await request(server)
      .post(`/api/v1/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ role: 'viewer', userId: memberUserId })
      .expect(403);

    await request(server)
      .patch(`/api/v1/projects/${projectId}/members/${memberUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'admin' })
      .expect(200)
      .expect(({ body }) => {
        expect((body as ProjectMemberResponse).role).toBe('admin');
      });

    const ownerId = await prisma.projectMember
      .findFirstOrThrow({
        where: { projectId, role: 'OWNER' },
        select: { userId: true },
      })
      .then((member) => member.userId);

    await request(server)
      .patch(`/api/v1/projects/${projectId}/members/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'admin' })
      .expect(400);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/members/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);

    await request(server)
      .delete(`/api/v1/projects/${projectId}/members/${memberUserId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
  });

  async function registerAndGetAccessToken(
    email: string,
    displayName: string,
  ): Promise<string> {
    return (await registerUser(email, displayName)).accessToken;
  }

  async function registerUser(
    email: string,
    displayName: string,
  ): Promise<AuthResponse> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ displayName, email, password })
      .expect(201);
    return response.body as AuthResponse;
  }
});
