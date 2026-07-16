import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import {
  PrismaClient,
  NotificationType,
  ProjectStatus,
  ProjectRole,
  TaskPriority,
  TaskType,
  UserRole,
} from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const scrypt = promisify(scryptCallback);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('base64url')}`;
}

const ids = {
  admin: '00000000-0000-4000-8000-000000000001',
  testUser: '00000000-0000-4000-8000-000000000002',
  memberTest: '00000000-0000-4000-8000-000000000003',
  viewer: '00000000-0000-4000-8000-000000000004',
  project: '00000000-0000-4000-8000-000000000101',
  todo: '00000000-0000-4000-8000-000000000201',
  inProgress: '00000000-0000-4000-8000-000000000202',
  review: '00000000-0000-4000-8000-000000000203',
  done: '00000000-0000-4000-8000-000000000204',
  epic: '00000000-0000-4000-8000-000000000301',
  workspaceTask: '00000000-0000-4000-8000-000000000302',
  workflowSubtask: '00000000-0000-4000-8000-000000000303',
  defectBug: '00000000-0000-4000-8000-000000000304',
  optimisticTask: '00000000-0000-4000-8000-000000000305',
  agentTask: '00000000-0000-4000-8000-000000000306',
  reportTask: '00000000-0000-4000-8000-000000000307',
  authDoneTask: '00000000-0000-4000-8000-000000000308',
  docsDoneTask: '00000000-0000-4000-8000-000000000309',
  commentPlan: '00000000-0000-4000-8000-000000000401',
  commentReview: '00000000-0000-4000-8000-000000000402',
  activityCreated: '00000000-0000-4000-8000-000000000501',
  activityStatus: '00000000-0000-4000-8000-000000000502',
  activityAssignee: '00000000-0000-4000-8000-000000000503',
  activityComment: '00000000-0000-4000-8000-000000000504',
  notificationAssigned: '00000000-0000-4000-8000-000000000601',
  notificationCommented: '00000000-0000-4000-8000-000000000602',
  notificationStatus: '00000000-0000-4000-8000-000000000603',
  notificationChild: '00000000-0000-4000-8000-000000000604',
  notificationMember: '00000000-0000-4000-8000-000000000605',
} as const;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seed(): Promise<void> {
  const adminPasswordHash = await hashPassword('Password123!');
  const userPasswordHash = await hashPassword('Password123!');
  const demoEmails = [
    'admin@velora.local',
    'test@velora.local',
    'member@velora.local',
    'viewer@velora.local',
  ];

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: {
        OR: [
          { projectId: ids.project },
          { recipient: { email: { in: demoEmails } } },
          { actor: { email: { in: demoEmails } } },
        ],
      },
    });
    await tx.comment.deleteMany({
      where: { author: { email: { in: demoEmails } } },
    });
    await tx.activity.deleteMany({
      where: { actor: { email: { in: demoEmails } } },
    });
    await tx.task.deleteMany({ where: { projectId: ids.project } });
    await tx.kanbanColumn.deleteMany({ where: { projectId: ids.project } });
    await tx.projectMember.deleteMany({ where: { projectId: ids.project } });
    await tx.user.deleteMany({ where: { email: { in: demoEmails } } });

    await Promise.all([
      tx.user.upsert({
        where: { id: ids.admin },
        update: {
          displayName: 'Admin Pro',
          email: 'admin@velora.local',
          passwordHash: adminPasswordHash,
          role: UserRole.ADMIN,
        },
        create: {
          id: ids.admin,
          displayName: 'Admin Pro',
          email: 'admin@velora.local',
          passwordHash: adminPasswordHash,
          role: UserRole.ADMIN,
        },
      }),
      tx.user.upsert({
        where: { id: ids.testUser },
        update: {
          displayName: 'Test User',
          email: 'test@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
        create: {
          id: ids.testUser,
          displayName: 'Test User',
          email: 'test@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
      }),
      tx.user.upsert({
        where: { id: ids.memberTest },
        update: {
          displayName: 'Member Test',
          email: 'member@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
        create: {
          id: ids.memberTest,
          displayName: 'Member Test',
          email: 'member@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
      }),
      tx.user.upsert({
        where: { id: ids.viewer },
        update: {
          displayName: 'Viewer Lee',
          email: 'viewer@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
        create: {
          id: ids.viewer,
          displayName: 'Viewer Lee',
          email: 'viewer@velora.local',
          passwordHash: userPasswordHash,
          role: UserRole.USER,
        },
      }),
    ]);

    await tx.project.upsert({
      where: { id: ids.project },
      update: {
        description: 'Core workspace delivery',
        key: 'PRJ1',
        name: 'Project 1',
        status: ProjectStatus.ACTIVE,
      },
      create: {
        description: 'Core workspace delivery',
        id: ids.project,
        key: 'PRJ1',
        name: 'Project 1',
        status: ProjectStatus.ACTIVE,
      },
    });

    await tx.projectMember.createMany({
      data: [
        {
          projectId: ids.project,
          userId: ids.admin,
          role: ProjectRole.OWNER,
        },
        {
          projectId: ids.project,
          userId: ids.testUser,
          role: ProjectRole.ADMIN,
        },
        {
          projectId: ids.project,
          userId: ids.memberTest,
          role: ProjectRole.MEMBER,
        },
        {
          projectId: ids.project,
          userId: ids.viewer,
          role: ProjectRole.VIEWER,
        },
      ],
    });

    await tx.kanbanColumn.createMany({
      data: [
        { id: ids.todo, projectId: ids.project, name: 'To Do', rank: 'a0' },
        {
          id: ids.inProgress,
          projectId: ids.project,
          name: 'In Progress',
          rank: 'a1',
        },
        { id: ids.review, projectId: ids.project, name: 'Review', rank: 'a2' },
        {
          id: ids.done,
          projectId: ids.project,
          name: 'Done',
          rank: 'a3',
          isDone: true,
        },
      ],
    });

    await tx.task.createMany({
      data: [
        {
          id: ids.epic,
          projectId: ids.project,
          columnId: ids.todo,
          code: 'PRJ1-101',
          title: 'Project 1 delivery',
          type: TaskType.EPIC,
          priority: TaskPriority.MEDIUM,
          reporterId: ids.admin,
          labels: ['Roadmap'],
          rank: 'a0',
        },
        {
          id: ids.workspaceTask,
          projectId: ids.project,
          columnId: ids.todo,
          parentId: ids.epic,
          code: 'PRJ1-125',
          title: 'Build Project 1 workspace',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          assigneeId: ids.admin,
          reporterId: ids.admin,
          labels: ['Frontend', 'Platform'],
          dueDate: new Date('2026-07-27T00:00:00.000Z'),
          rank: 'a1',
        },
        {
          id: ids.workflowSubtask,
          projectId: ids.project,
          columnId: ids.todo,
          parentId: ids.workspaceTask,
          code: 'PRJ1-149',
          title: 'Validate Project 1 workflow',
          type: TaskType.SUBTASK,
          priority: TaskPriority.MEDIUM,
          assigneeId: ids.memberTest,
          reporterId: ids.admin,
          labels: ['QA'],
          rank: 'a2',
        },
        {
          id: ids.defectBug,
          projectId: ids.project,
          columnId: ids.inProgress,
          code: 'PRJ1-161',
          title: 'Fix standalone Project 1 defect',
          type: TaskType.BUG,
          priority: TaskPriority.HIGH,
          assigneeId: ids.admin,
          reporterId: ids.testUser,
          labels: ['Bug', 'Backend'],
          dueDate: new Date('2026-07-24T00:00:00.000Z'),
          rank: 'a0',
        },
        {
          id: ids.optimisticTask,
          projectId: ids.project,
          columnId: ids.inProgress,
          parentId: ids.epic,
          code: 'PRJ1-162',
          title: 'Test optimistic rendering task',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          assigneeId: ids.testUser,
          reporterId: ids.admin,
          labels: ['Frontend'],
          rank: 'a1',
        },
        {
          id: ids.agentTask,
          projectId: ids.project,
          columnId: ids.review,
          code: 'PRJ1-163',
          title: 'Agent Test Task',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          assigneeId: ids.testUser,
          reporterId: ids.memberTest,
          labels: ['Automation'],
          rank: 'a0',
        },
        {
          id: ids.reportTask,
          projectId: ids.project,
          columnId: ids.review,
          parentId: ids.epic,
          code: 'PRJ1-164',
          title: 'Prepare portfolio demo report',
          type: TaskType.TASK,
          priority: TaskPriority.LOW,
          assigneeId: ids.memberTest,
          reporterId: ids.admin,
          labels: ['Reporting'],
          rank: 'a1',
        },
        {
          id: ids.authDoneTask,
          projectId: ids.project,
          columnId: ids.done,
          code: 'PRJ1-165',
          title: 'Connect authentication to API',
          type: TaskType.TASK,
          priority: TaskPriority.HIGH,
          assigneeId: ids.admin,
          reporterId: ids.admin,
          labels: ['Auth', 'API'],
          rank: 'a0',
        },
        {
          id: ids.docsDoneTask,
          projectId: ids.project,
          columnId: ids.done,
          code: 'PRJ1-166',
          title: 'Document notification decisions',
          type: TaskType.TASK,
          priority: TaskPriority.MEDIUM,
          assigneeId: ids.testUser,
          reporterId: ids.admin,
          labels: ['Docs'],
          rank: 'a1',
        },
      ],
    });

    await tx.comment.createMany({
      data: [
        {
          id: ids.commentPlan,
          taskId: ids.workspaceTask,
          authorId: ids.testUser,
          body: 'Board data is ready for the product demo pass.',
          createdAt: hoursAgo(6),
          updatedAt: hoursAgo(6),
        },
        {
          id: ids.commentReview,
          taskId: ids.agentTask,
          authorId: ids.memberTest,
          body: 'Review checklist is almost complete. Please verify notifications.',
          createdAt: hoursAgo(3),
          updatedAt: hoursAgo(3),
        },
      ],
    });

    await tx.activity.createMany({
      data: [
        {
          id: ids.activityCreated,
          projectId: ids.project,
          taskId: ids.workspaceTask,
          actorId: ids.admin,
          field: 'created',
          from: null,
          to: 'work item',
          createdAt: daysAgo(2),
        },
        {
          id: ids.activityStatus,
          projectId: ids.project,
          taskId: ids.agentTask,
          actorId: ids.testUser,
          field: 'status',
          from: 'To Do',
          to: 'Review',
          createdAt: hoursAgo(5),
        },
        {
          id: ids.activityAssignee,
          projectId: ids.project,
          taskId: ids.reportTask,
          actorId: ids.admin,
          field: 'assignee',
          from: null,
          to: ids.memberTest,
          createdAt: hoursAgo(4),
        },
        {
          id: ids.activityComment,
          projectId: ids.project,
          taskId: ids.workspaceTask,
          actorId: ids.testUser,
          field: 'commented',
          from: null,
          to: ids.commentPlan,
          createdAt: hoursAgo(6),
        },
      ],
    });

    await tx.notification.createMany({
      data: [
        {
          id: ids.notificationAssigned,
          recipientId: ids.admin,
          actorId: ids.testUser,
          projectId: ids.project,
          taskId: ids.workspaceTask,
          type: NotificationType.TASK_ASSIGNED,
          metadata: {
            columnName: 'To Do',
            projectName: 'Project 1',
            taskCode: 'PRJ1-125',
            taskTitle: 'Build Project 1 workspace',
            taskType: 'task',
          },
          createdAt: hoursAgo(2),
        },
        {
          id: ids.notificationCommented,
          recipientId: ids.admin,
          actorId: ids.testUser,
          projectId: ids.project,
          taskId: ids.workspaceTask,
          type: NotificationType.TASK_COMMENTED,
          metadata: {
            columnName: 'To Do',
            projectName: 'Project 1',
            taskCode: 'PRJ1-125',
            taskTitle: 'Build Project 1 workspace',
            taskType: 'task',
          },
          createdAt: hoursAgo(1),
        },
        {
          id: ids.notificationStatus,
          recipientId: ids.admin,
          actorId: ids.testUser,
          projectId: ids.project,
          taskId: ids.agentTask,
          type: NotificationType.TASK_STATUS_CHANGED,
          metadata: {
            fromColumnName: 'To Do',
            projectName: 'Project 1',
            taskCode: 'PRJ1-163',
            taskTitle: 'Agent Test Task',
            taskType: 'task',
            toColumnName: 'Review',
          },
          createdAt: hoursAgo(5),
        },
        {
          id: ids.notificationChild,
          recipientId: ids.admin,
          actorId: ids.memberTest,
          projectId: ids.project,
          taskId: ids.workflowSubtask,
          type: NotificationType.TASK_CHILD_CREATED,
          metadata: {
            childType: 'subtask',
            columnName: 'To Do',
            parentCode: 'PRJ1-125',
            parentTitle: 'Build Project 1 workspace',
            projectName: 'Project 1',
            taskCode: 'PRJ1-149',
            taskTitle: 'Validate Project 1 workflow',
            taskType: 'subtask',
          },
          createdAt: hoursAgo(8),
          readAt: hoursAgo(7),
        },
        {
          id: ids.notificationMember,
          recipientId: ids.memberTest,
          actorId: ids.admin,
          projectId: ids.project,
          taskId: null,
          type: NotificationType.PROJECT_MEMBER_ADDED,
          metadata: { projectKey: 'PRJ1', projectName: 'Project 1' },
          createdAt: daysAgo(1),
        },
      ],
    });
  });
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
