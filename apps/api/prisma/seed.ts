import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ProjectRole,
  TaskType,
} from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ids = {
  user: '00000000-0000-4000-8000-000000000001',
  project: '00000000-0000-4000-8000-000000000101',
  todo: '00000000-0000-4000-8000-000000000201',
  inProgress: '00000000-0000-4000-8000-000000000202',
  review: '00000000-0000-4000-8000-000000000203',
  done: '00000000-0000-4000-8000-000000000204',
  epic: '00000000-0000-4000-8000-000000000301',
  task: '00000000-0000-4000-8000-000000000302',
  subtask: '00000000-0000-4000-8000-000000000303',
  bug: '00000000-0000-4000-8000-000000000304',
} as const;

async function seed(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: ids.user },
      update: {
        displayName: 'Admin Pro',
        email: 'admin@velora.local',
      },
      create: {
        id: ids.user,
        displayName: 'Admin Pro',
        email: 'admin@velora.local',
      },
    });

    await tx.project.upsert({
      where: { id: ids.project },
      update: { key: 'PRJ1', name: 'Project 1' },
      create: { id: ids.project, key: 'PRJ1', name: 'Project 1' },
    });

    await tx.task.deleteMany({ where: { projectId: ids.project } });
    await tx.kanbanColumn.deleteMany({ where: { projectId: ids.project } });
    await tx.projectMember.deleteMany({ where: { projectId: ids.project } });

    await tx.projectMember.create({
      data: {
        projectId: ids.project,
        userId: ids.user,
        role: ProjectRole.OWNER,
      },
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
        { id: ids.done, projectId: ids.project, name: 'Done', rank: 'a3' },
      ],
    });

    await tx.task.create({
      data: {
        id: ids.epic,
        projectId: ids.project,
        columnId: ids.todo,
        code: 'PRJ1-101',
        title: 'Project 1 delivery',
        type: TaskType.EPIC,
        rank: 'a0',
      },
    });

    await tx.task.create({
      data: {
        id: ids.task,
        projectId: ids.project,
        columnId: ids.todo,
        parentId: ids.epic,
        code: 'PRJ1-125',
        title: 'Build Project 1 workspace',
        type: TaskType.TASK,
        rank: 'a1',
      },
    });

    await tx.task.create({
      data: {
        id: ids.subtask,
        projectId: ids.project,
        columnId: ids.todo,
        parentId: ids.task,
        code: 'PRJ1-149',
        title: 'Validate Project 1 workflow',
        type: TaskType.SUBTASK,
        rank: 'a2',
      },
    });

    await tx.task.create({
      data: {
        id: ids.bug,
        projectId: ids.project,
        columnId: ids.inProgress,
        code: 'PRJ1-161',
        title: 'Fix standalone Project 1 defect',
        type: TaskType.BUG,
        rank: 'a0',
      },
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
