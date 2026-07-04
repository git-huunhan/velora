import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ProjectRole,
  TaskType,
} from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL as string;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

describe('Prisma domain integration', () => {
  const key = `T${Date.now()}`;
  let projectId: string | undefined;
  let userId: string | undefined;

  afterAll(async () => {
    if (projectId) await prisma.project.delete({ where: { id: projectId } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('persists membership and Epic -> Task -> Subtask hierarchy', async () => {
    const project = await prisma.project.create({
      data: {
        key,
        name: 'Integration project',
        members: {
          create: {
            role: ProjectRole.OWNER,
            user: {
              create: {
                displayName: 'Integration Owner',
                email: `${key.toLowerCase()}@example.com`,
              },
            },
          },
        },
        columns: { create: { name: 'To Do', rank: 'a0' } },
      },
      include: { columns: true, members: true },
    });
    projectId = project.id;
    userId = project.members[0].userId;
    const columnId = project.columns[0].id;

    const epic = await prisma.task.create({
      data: {
        code: `${key}-1`,
        columnId,
        projectId,
        rank: 'a0',
        title: 'Integration epic',
        type: TaskType.EPIC,
      },
    });
    const task = await prisma.task.create({
      data: {
        code: `${key}-2`,
        columnId,
        parentId: epic.id,
        projectId,
        rank: 'a1',
        title: 'Integration task',
        type: TaskType.TASK,
      },
    });
    await prisma.task.create({
      data: {
        code: `${key}-3`,
        columnId,
        parentId: task.id,
        projectId,
        rank: 'a2',
        title: 'Integration subtask',
        type: TaskType.SUBTASK,
      },
    });

    const stored = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        members: true,
        tasks: { include: { children: true }, orderBy: { rank: 'asc' } },
      },
    });
    expect(stored.members).toHaveLength(1);
    expect(stored.members[0].role).toBe(ProjectRole.OWNER);
    expect(stored.tasks).toHaveLength(3);
    expect(
      stored.tasks.find((item) => item.id === epic.id)?.children[0].id,
    ).toBe(task.id);
    expect(
      stored.tasks.find((item) => item.id === task.id)?.children,
    ).toHaveLength(1);
  });

  it('enforces unique ranks within a column', async () => {
    const column = await prisma.kanbanColumn.findFirstOrThrow({
      where: { projectId },
    });
    await expect(
      prisma.task.create({
        data: {
          code: `${key}-4`,
          columnId: column.id,
          projectId: projectId!,
          rank: 'a0',
          title: 'Duplicate rank',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
