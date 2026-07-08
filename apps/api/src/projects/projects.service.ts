import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { ProjectResponse } from '../domain/contracts';
import {
  ProjectRole as ApiProjectRole,
  ProjectStatus as ApiProjectStatus,
  TaskPriority as ApiTaskPriority,
  TaskType as ApiTaskType,
} from '../domain/contracts/enums';
import {
  validateParentAssignment,
  validateTaskDeletion,
  type HierarchyTask,
} from '../domain/policies/task-hierarchy.policy';
import {
  hasProjectPermission,
  ProjectPermission,
} from '../domain/policies/project-permission.policy';
import { validateMoveAnchors } from '../domain/policies/ordering.policy';
import { PrismaService } from '../database/prisma.service';
import {
  ProjectRole,
  ProjectStatus as PrismaProjectStatus,
  TaskPriority as PrismaTaskPriority,
  TaskType as PrismaTaskType,
  type Prisma,
} from '../generated/prisma/client';
import type { MoveColumnDto, MoveTaskDto } from '../domain/dto/move-task.dto';
import { toActivityResponse } from './activity.mapper';
import type { ActivityListResponse } from './contracts/activity-list.contract';
import type { CommentListResponse } from './contracts/comment-list.contract';
import type { KanbanColumnListResponse } from './contracts/kanban-column-list.contract';
import type { ProjectListResponse } from './contracts/project-list.contract';
import type { ProjectMemberListResponse } from './contracts/project-member-list.contract';
import type { TaskListResponse } from './contracts/task-list.contract';
import { toCommentResponse } from './comment.mapper';
import type { AddProjectMemberDto } from './dto/add-project-member.dto';
import type { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import { toKanbanColumnResponse } from './kanban-column.mapper';
import { toProjectMemberResponse } from './project-member.mapper';
import { toProjectResponse } from './project.mapper';
import { toTaskResponse } from './task.mapper';

const PROJECT_SORT_FIELDS = new Set(['createdAt', 'key', 'name', 'updatedAt']);
const DEFAULT_COLUMNS: Prisma.KanbanColumnCreateWithoutProjectInput[] = [
  { name: 'To Do', rank: 'a0' },
  { name: 'In Progress', rank: 'a1' },
  { name: 'Review', rank: 'a2' },
  { isDone: true, name: 'Done', rank: 'a3' },
];

const statusToPrisma = {
  [ApiProjectStatus.ACTIVE]: PrismaProjectStatus.ACTIVE,
  [ApiProjectStatus.COMPLETED]: PrismaProjectStatus.COMPLETED,
  [ApiProjectStatus.PLANNING]: PrismaProjectStatus.PLANNING,
} as const;
const roleToApi = {
  ADMIN: ApiProjectRole.ADMIN,
  MEMBER: ApiProjectRole.MEMBER,
  OWNER: ApiProjectRole.OWNER,
  VIEWER: ApiProjectRole.VIEWER,
} as const;
const roleToPrisma = {
  [ApiProjectRole.ADMIN]: ProjectRole.ADMIN,
  [ApiProjectRole.MEMBER]: ProjectRole.MEMBER,
  [ApiProjectRole.OWNER]: ProjectRole.OWNER,
  [ApiProjectRole.VIEWER]: ProjectRole.VIEWER,
} as const;
const priorityToPrisma = {
  [ApiTaskPriority.HIGH]: PrismaTaskPriority.HIGH,
  [ApiTaskPriority.LOW]: PrismaTaskPriority.LOW,
  [ApiTaskPriority.MEDIUM]: PrismaTaskPriority.MEDIUM,
} as const;
const priorityToApi = {
  HIGH: ApiTaskPriority.HIGH,
  LOW: ApiTaskPriority.LOW,
  MEDIUM: ApiTaskPriority.MEDIUM,
} as const;
const taskTypeToPrisma = {
  [ApiTaskType.BUG]: PrismaTaskType.BUG,
  [ApiTaskType.EPIC]: PrismaTaskType.EPIC,
  [ApiTaskType.SUBTASK]: PrismaTaskType.SUBTASK,
  [ApiTaskType.TASK]: PrismaTaskType.TASK,
} as const;
const taskTypeToApi = {
  BUG: ApiTaskType.BUG,
  EPIC: ApiTaskType.EPIC,
  SUBTASK: ApiTaskType.SUBTASK,
  TASK: ApiTaskType.TASK,
} as const;

function columnRankAt(index: number): string {
  return `a${String(index).padStart(6, '0')}`;
}

function taskRankAt(index: number): string {
  return `a${String(index).padStart(8, '0')}`;
}

type ActivityChange = {
  field: string;
  from: string | null;
  to: string | null;
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProjects(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<ProjectListResponse> {
    const sort = this.parseSort(query.sort);
    const search = query.search?.trim();
    const where: Prisma.ProjectWhereInput = {
      members: { some: { userId } },
      ...(search
        ? {
            OR: [
              { key: { contains: search, mode: 'insensitive' } },
              { name: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: sort,
        skip,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects.map(toProjectResponse),
      meta: {
        limit: query.limit,
        page: query.page,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_PROJECT,
    );
    return toProjectResponse(
      await this.prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
    );
  }

  async createProject(
    userId: string,
    input: CreateProjectDto,
  ): Promise<ProjectResponse> {
    const key = input.key.trim().toUpperCase();
    if (await this.prisma.project.findUnique({ where: { key } })) {
      throw new ConflictException('A project with this key already exists.');
    }

    const project = await this.prisma.project.create({
      data: {
        avatarUrl: input.avatarUrl?.trim() || null,
        columns: { create: DEFAULT_COLUMNS },
        description: input.description?.trim() ?? '',
        key,
        members: {
          create: {
            role: ProjectRole.OWNER,
            userId,
          },
        },
        name: input.name.trim(),
        status: PrismaProjectStatus.ACTIVE,
      },
    });
    return toProjectResponse(project);
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.UPDATE_PROJECT,
    );

    const data: Prisma.ProjectUpdateInput = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.description !== undefined) {
      data.description = input.description.trim();
    }
    if (input.status !== undefined) data.status = statusToPrisma[input.status];
    if (input.startDate !== undefined) {
      data.startDate = input.startDate ? new Date(input.startDate) : null;
    }
    if (input.endDate !== undefined) {
      data.endDate = input.endDate ? new Date(input.endDate) : null;
    }
    if (input.avatarUrl !== undefined) {
      data.avatarUrl = input.avatarUrl?.trim() || null;
    }

    return toProjectResponse(
      await this.prisma.project.update({ where: { id: projectId }, data }),
    );
  }

  async archiveProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.DELETE_PROJECT,
    );
    return toProjectResponse(
      await this.prisma.project.update({
        where: { id: projectId },
        data: { archivedAt: new Date() },
      }),
    );
  }

  async unarchiveProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.DELETE_PROJECT,
    );
    return toProjectResponse(
      await this.prisma.project.update({
        where: { id: projectId },
        data: { archivedAt: null },
      }),
    );
  }

  async listProjectMembers(
    userId: string,
    projectId: string,
  ): Promise<ProjectMemberListResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_PROJECT,
    );
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: true },
      orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
    });
    return { data: members.map(toProjectMemberResponse) };
  }

  async addProjectMember(
    userId: string,
    projectId: string,
    input: AddProjectMemberDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_MEMBERS,
    );
    await this.assertUserExists(input.userId);

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: input.userId } },
    });
    if (existing) {
      throw new ConflictException('This user is already a project member.');
    }

    return toProjectMemberResponse(
      await this.prisma.projectMember.create({
        data: {
          projectId,
          role: roleToPrisma[input.role],
          userId: input.userId,
        },
        include: { user: true },
      }),
    );
  }

  async updateProjectMember(
    userId: string,
    projectId: string,
    memberUserId: string,
    input: UpdateProjectMemberDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_MEMBERS,
    );
    const member = await this.getProjectMemberOrThrow(projectId, memberUserId);
    if (
      member.role === ProjectRole.OWNER &&
      roleToPrisma[input.role] !== ProjectRole.OWNER
    ) {
      await this.assertProjectKeepsOwner(projectId);
    }

    return toProjectMemberResponse(
      await this.prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId: memberUserId } },
        data: { role: roleToPrisma[input.role] },
        include: { user: true },
      }),
    );
  }

  async removeProjectMember(
    userId: string,
    projectId: string,
    memberUserId: string,
  ): Promise<void> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_MEMBERS,
    );
    const member = await this.getProjectMemberOrThrow(projectId, memberUserId);
    if (member.role === ProjectRole.OWNER) {
      await this.assertProjectKeepsOwner(projectId);
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberUserId } },
    });
  }

  async listKanbanColumns(
    userId: string,
    projectId: string,
  ): Promise<KanbanColumnListResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_PROJECT,
    );
    const columns = await this.prisma.kanbanColumn.findMany({
      where: { projectId },
      orderBy: { rank: 'asc' },
    });
    return { data: columns.map(toKanbanColumnResponse) };
  }

  async createKanbanColumn(
    userId: string,
    projectId: string,
    input: CreateKanbanColumnDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_WORKFLOW,
    );
    const name = input.name.trim();
    const count = await this.prisma.kanbanColumn.count({
      where: { projectId },
    });
    try {
      return toKanbanColumnResponse(
        await this.prisma.kanbanColumn.create({
          data: {
            isDone: input.isDone ?? false,
            name,
            projectId,
            rank: columnRankAt(count),
          },
        }),
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A column with this name already exists.');
      }
      throw error;
    }
  }

  async updateKanbanColumn(
    userId: string,
    projectId: string,
    columnId: string,
    input: UpdateKanbanColumnDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_WORKFLOW,
    );
    await this.getKanbanColumnOrThrow(projectId, columnId);

    try {
      return toKanbanColumnResponse(
        await this.prisma.kanbanColumn.update({
          where: { id: columnId },
          data: {
            ...(input.name !== undefined ? { name: input.name.trim() } : {}),
            ...(input.isDone !== undefined ? { isDone: input.isDone } : {}),
          },
        }),
      );
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A column with this name already exists.');
      }
      throw error;
    }
  }

  async moveKanbanColumn(
    userId: string,
    projectId: string,
    columnId: string,
    input: MoveColumnDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_WORKFLOW,
    );
    const columns = await this.prisma.kanbanColumn.findMany({
      where: { projectId },
      orderBy: { rank: 'asc' },
    });
    const movingColumn = columns.find((column) => column.id === columnId);
    if (!movingColumn) {
      throw new NotFoundException('The column was not found.');
    }
    if (movingColumn.updatedAt.toISOString() !== input.expectedUpdatedAt) {
      throw new ConflictException('The column was updated by another request.');
    }

    const validation = validateMoveAnchors(
      { id: movingColumn.id, scopeId: movingColumn.projectId },
      input.beforeColumnId,
      input.afterColumnId,
      columns.map((column) => ({ id: column.id, scopeId: column.projectId })),
    );
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const reordered = columns.filter((column) => column.id !== columnId);
    const beforeIndex = input.beforeColumnId
      ? reordered.findIndex((column) => column.id === input.beforeColumnId)
      : -1;
    const afterIndex = input.afterColumnId
      ? reordered.findIndex((column) => column.id === input.afterColumnId)
      : -1;
    const insertIndex =
      beforeIndex >= 0
        ? beforeIndex
        : afterIndex >= 0
          ? afterIndex + 1
          : reordered.length;
    reordered.splice(insertIndex, 0, movingColumn);

    const updated = await this.prisma.$transaction(async (transaction) => {
      for (const [index, column] of reordered.entries()) {
        await transaction.kanbanColumn.update({
          where: { id: column.id },
          data: { rank: columnRankAt(index) },
        });
      }
      return transaction.kanbanColumn.findUniqueOrThrow({
        where: { id: columnId },
      });
    });

    return toKanbanColumnResponse(updated);
  }

  async deleteKanbanColumn(
    userId: string,
    projectId: string,
    columnId: string,
  ): Promise<void> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.MANAGE_WORKFLOW,
    );
    await this.getKanbanColumnOrThrow(projectId, columnId);
    const [columnCount, taskCount] = await this.prisma.$transaction([
      this.prisma.kanbanColumn.count({ where: { projectId } }),
      this.prisma.task.count({ where: { columnId } }),
    ]);
    if (columnCount <= 1) {
      throw new BadRequestException('A project must keep at least one column.');
    }
    if (taskCount > 0) {
      throw new ConflictException('Move or delete tasks in this column first.');
    }

    await this.prisma.kanbanColumn.delete({ where: { id: columnId } });
  }

  async listTasks(
    userId: string,
    projectId: string,
  ): Promise<TaskListResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_WORK_ITEMS,
    );
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: { assignee: true, reporter: true },
      orderBy: [{ column: { rank: 'asc' } }, { rank: 'asc' }],
    });
    return { data: tasks.map(toTaskResponse) };
  }

  async getTask(userId: string, projectId: string, taskId: string) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_WORK_ITEMS,
    );
    return toTaskResponse(await this.getTaskOrThrow(projectId, taskId));
  }

  async createTask(userId: string, projectId: string, input: CreateTaskDto) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.CREATE_WORK_ITEMS,
    );
    await this.getKanbanColumnOrThrow(projectId, input.columnId);
    if (input.assigneeId) {
      await this.assertProjectMemberExists(projectId, input.assigneeId);
    }

    const parentId = input.parentId ?? null;
    const type = input.type;
    const hierarchyTasks = await this.getHierarchyTasks(projectId);
    const hierarchyValidation = validateParentAssignment(
      { id: '__new_task__', parentId: null, projectId, type },
      parentId,
      hierarchyTasks,
    );
    if (!hierarchyValidation.valid) {
      throw new BadRequestException(hierarchyValidation.reason);
    }

    const [code, rank] = await Promise.all([
      this.nextTaskCode(projectId),
      this.nextTaskRank(input.columnId),
    ]);

    const task = await this.prisma.$transaction(async (transaction) => {
      const createdTask = await transaction.task.create({
        data: {
          assigneeId: input.assigneeId ?? null,
          code,
          columnId: input.columnId,
          description: input.description?.trim() ?? '',
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          labels: this.normalizeLabels(input.labels),
          parentId,
          priority: priorityToPrisma[input.priority ?? ApiTaskPriority.MEDIUM],
          projectId,
          rank,
          reporterId: userId,
          title: input.title.trim(),
          type: taskTypeToPrisma[type],
        },
        include: { assignee: true, reporter: true },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'created',
        from: null,
        taskId: createdTask.id,
        to: createdTask.code,
      });
      return createdTask;
    });
    return toTaskResponse(task);
  }

  async updateTask(
    userId: string,
    projectId: string,
    taskId: string,
    input: UpdateTaskDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.UPDATE_WORK_ITEMS,
    );
    const existing = await this.getTaskOrThrow(projectId, taskId);
    if (input.columnId) {
      await this.getKanbanColumnOrThrow(projectId, input.columnId);
    }
    if (input.assigneeId) {
      await this.assertProjectMemberExists(projectId, input.assigneeId);
    }

    const nextType = input.type ?? taskTypeToApi[existing.type];
    const nextParentId =
      input.parentId !== undefined ? input.parentId : existing.parentId;
    const hierarchyTasks = await this.getHierarchyTasks(projectId);
    const hierarchyValidation = validateParentAssignment(
      {
        id: existing.id,
        parentId: existing.parentId,
        projectId,
        type: nextType,
      },
      nextParentId ?? null,
      hierarchyTasks,
    );
    if (!hierarchyValidation.valid) {
      throw new BadRequestException(hierarchyValidation.reason);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (input.columnId !== undefined) {
      data.column = { connect: { id: input.columnId } };
    }
    if (input.parentId !== undefined) {
      data.parent = input.parentId
        ? { connect: { id: input.parentId } }
        : { disconnect: true };
    }
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId
        ? { connect: { id: input.assigneeId } }
        : { disconnect: true };
    }
    if (input.title !== undefined) data.title = input.title.trim();
    if (input.description !== undefined) {
      data.description = input.description.trim();
    }
    if (input.type !== undefined) data.type = taskTypeToPrisma[input.type];
    if (input.priority !== undefined) {
      data.priority = priorityToPrisma[input.priority];
    }
    if (input.labels !== undefined)
      data.labels = this.normalizeLabels(input.labels);
    if (input.dueDate !== undefined) {
      data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const updatedTask = await transaction.task.update({
        where: { id: taskId },
        data,
        include: { assignee: true, reporter: true },
      });
      await this.createActivities(
        transaction,
        userId,
        taskId,
        this.collectTaskUpdateActivities(existing, updatedTask),
      );
      return updatedTask;
    });

    return toTaskResponse(updated);
  }

  async moveTask(
    userId: string,
    projectId: string,
    taskId: string,
    input: MoveTaskDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.UPDATE_WORK_ITEMS,
    );
    const movingTask = await this.getTaskOrThrow(projectId, taskId);
    if (movingTask.updatedAt.toISOString() !== input.expectedUpdatedAt) {
      throw new ConflictException('The task was updated by another request.');
    }
    await this.getKanbanColumnOrThrow(projectId, input.targetColumnId);

    const targetParentId = input.targetParentId ?? null;
    const hierarchyTasks = await this.getHierarchyTasks(projectId);
    const hierarchyValidation = validateParentAssignment(
      {
        id: movingTask.id,
        parentId: movingTask.parentId,
        projectId,
        type: taskTypeToApi[movingTask.type],
      },
      targetParentId,
      hierarchyTasks,
    );
    if (!hierarchyValidation.valid) {
      throw new BadRequestException(hierarchyValidation.reason);
    }

    const targetTasks = await this.prisma.task.findMany({
      where: { columnId: input.targetColumnId },
      orderBy: { rank: 'asc' },
    });
    const anchorValidation = validateMoveAnchors(
      { id: taskId, scopeId: input.targetColumnId },
      input.beforeTaskId,
      input.afterTaskId,
      targetTasks.map((task) => ({ id: task.id, scopeId: task.columnId })),
    );
    if (!anchorValidation.valid) {
      throw new BadRequestException(anchorValidation.reason);
    }

    const reordered = targetTasks.filter((task) => task.id !== taskId);
    const beforeIndex = input.beforeTaskId
      ? reordered.findIndex((task) => task.id === input.beforeTaskId)
      : -1;
    const afterIndex = input.afterTaskId
      ? reordered.findIndex((task) => task.id === input.afterTaskId)
      : -1;
    const insertIndex =
      beforeIndex >= 0
        ? beforeIndex
        : afterIndex >= 0
          ? afterIndex + 1
          : reordered.length;
    reordered.splice(insertIndex, 0, movingTask);

    const moved = await this.prisma.$transaction(async (transaction) => {
      const moveToken = `moving-${taskId}-${Date.now()}`;
      await transaction.task.update({
        where: { id: taskId },
        data: { rank: moveToken },
      });

      for (const [index, task] of reordered.entries()) {
        if (task.id === taskId) continue;
        await transaction.task.update({
          where: { id: task.id },
          data: { rank: `tmp-${index}-${task.id}` },
        });
      }

      for (const [index, task] of reordered.entries()) {
        await transaction.task.update({
          where: { id: task.id },
          data:
            task.id === taskId
              ? {
                  column: { connect: { id: input.targetColumnId } },
                  parent: targetParentId
                    ? { connect: { id: targetParentId } }
                    : { disconnect: true },
                  rank: taskRankAt(index),
                }
              : { rank: taskRankAt(index) },
        });
      }

      const movedTask = await transaction.task.findUniqueOrThrow({
        where: { id: taskId },
        include: { assignee: true, reporter: true },
      });
      await this.createActivities(
        transaction,
        userId,
        taskId,
        this.collectTaskUpdateActivities(movingTask, movedTask),
      );
      return movedTask;
    });

    return toTaskResponse(moved);
  }

  async listTaskComments(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<CommentListResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_WORK_ITEMS,
    );
    await this.getTaskOrThrow(projectId, taskId);
    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });
    return { data: comments.map(toCommentResponse) };
  }

  async createTaskComment(
    userId: string,
    projectId: string,
    taskId: string,
    input: CreateCommentDto,
  ) {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.UPDATE_WORK_ITEMS,
    );
    await this.getTaskOrThrow(projectId, taskId);

    const comment = await this.prisma.$transaction(async (transaction) => {
      const createdComment = await transaction.comment.create({
        data: {
          authorId: userId,
          body: input.body.trim(),
          taskId,
        },
        include: { author: true },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'commented',
        from: null,
        taskId,
        to: createdComment.id,
      });
      return createdComment;
    });

    return toCommentResponse(comment);
  }

  async listTaskActivities(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<ActivityListResponse> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.READ_WORK_ITEMS,
    );
    await this.getTaskOrThrow(projectId, taskId);
    const activities = await this.prisma.activity.findMany({
      where: { taskId },
      include: { actor: true },
      orderBy: { createdAt: 'asc' },
    });
    return { data: activities.map(toActivityResponse) };
  }

  async deleteTask(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    await this.assertProjectPermission(
      userId,
      projectId,
      ProjectPermission.DELETE_WORK_ITEMS,
    );
    await this.getTaskOrThrow(projectId, taskId);
    const hierarchyValidation = validateTaskDeletion(
      taskId,
      await this.getHierarchyTasks(projectId),
    );
    if (!hierarchyValidation.valid) {
      throw new BadRequestException(hierarchyValidation.reason);
    }
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  private async assertProjectPermission(
    userId: string,
    projectId: string,
    permission: ProjectPermission,
  ): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });
      if (!project) throw new NotFoundException('The project was not found.');
      throw new ForbiddenException('You do not have access to this project.');
    }
    if (!hasProjectPermission(roleToApi[membership.role], permission)) {
      throw new ForbiddenException(
        'You do not have permission for this project.',
      );
    }
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('The user was not found.');
  }

  private async getProjectMemberOrThrow(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) {
      throw new NotFoundException('The project member was not found.');
    }
    return member;
  }

  private async getKanbanColumnOrThrow(projectId: string, columnId: string) {
    const column = await this.prisma.kanbanColumn.findUnique({
      where: { id: columnId },
    });
    if (!column || column.projectId !== projectId) {
      throw new NotFoundException('The column was not found.');
    }
    return column;
  }

  private async getTaskOrThrow(projectId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, reporter: true },
    });
    if (!task || task.projectId !== projectId) {
      throw new NotFoundException('The task was not found.');
    }
    return task;
  }

  private collectTaskUpdateActivities(
    previous: {
      assigneeId: string | null;
      columnId: string;
      description: string;
      dueDate: Date | null;
      labels: string[];
      parentId: string | null;
      priority: PrismaTaskPriority;
      rank: string;
      title: string;
      type: PrismaTaskType;
    },
    next: {
      assigneeId: string | null;
      columnId: string;
      description: string;
      dueDate: Date | null;
      labels: string[];
      parentId: string | null;
      priority: PrismaTaskPriority;
      rank: string;
      title: string;
      type: PrismaTaskType;
    },
  ): ActivityChange[] {
    const fields: Array<{
      field: string;
      from: string | null;
      to: string | null;
    }> = [
      {
        field: 'columnId',
        from: previous.columnId,
        to: next.columnId,
      },
      {
        field: 'parentId',
        from: previous.parentId,
        to: next.parentId,
      },
      {
        field: 'assigneeId',
        from: previous.assigneeId,
        to: next.assigneeId,
      },
      {
        field: 'title',
        from: previous.title,
        to: next.title,
      },
      {
        field: 'description',
        from: previous.description,
        to: next.description,
      },
      {
        field: 'type',
        from: taskTypeToApi[previous.type],
        to: taskTypeToApi[next.type],
      },
      {
        field: 'priority',
        from: priorityToApi[previous.priority],
        to: priorityToApi[next.priority],
      },
      {
        field: 'labels',
        from: JSON.stringify(previous.labels),
        to: JSON.stringify(next.labels),
      },
      {
        field: 'dueDate',
        from: previous.dueDate?.toISOString() ?? null,
        to: next.dueDate?.toISOString() ?? null,
      },
      {
        field: 'rank',
        from: previous.rank,
        to: next.rank,
      },
    ];

    return fields.filter((field) => field.from !== field.to);
  }

  private async createActivities(
    transaction: Prisma.TransactionClient,
    actorId: string,
    taskId: string,
    changes: ActivityChange[],
  ): Promise<void> {
    for (const change of changes) {
      await this.createActivity(transaction, {
        actorId,
        field: change.field,
        from: change.from,
        taskId,
        to: change.to,
      });
    }
  }

  private async createActivity(
    transaction: Prisma.TransactionClient,
    data: {
      actorId: string;
      field: string;
      from: string | null;
      taskId: string;
      to: string | null;
    },
  ): Promise<void> {
    await transaction.activity.create({ data });
  }

  private async assertProjectMemberExists(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { userId: true },
    });
    if (!member) {
      throw new BadRequestException('The assignee must be a project member.');
    }
  }

  private async getHierarchyTasks(projectId: string): Promise<HierarchyTask[]> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      select: { id: true, parentId: true, projectId: true, type: true },
    });
    return tasks.map((task) => ({
      id: task.id,
      parentId: task.parentId,
      projectId: task.projectId,
      type: taskTypeToApi[task.type],
    }));
  }

  private async nextTaskCode(projectId: string): Promise<string> {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { key: true },
    });
    const latestTask = await this.prisma.task.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { code: true },
    });
    const latestNumber = latestTask?.code.startsWith(`${project.key}-`)
      ? Number(latestTask.code.slice(project.key.length + 1))
      : 0;
    return `${project.key}-${Number.isFinite(latestNumber) ? latestNumber + 1 : 1}`;
  }

  private async nextTaskRank(columnId: string): Promise<string> {
    const tasks = await this.prisma.task.findMany({
      where: { columnId },
      select: { rank: true },
    });
    const maxRank = tasks.reduce((max, task) => {
      const match = /^a(\d+)$/.exec(task.rank);
      if (!match) return max;
      return Math.max(max, Number(match[1]));
    }, -1);
    return taskRankAt(maxRank + 1);
  }

  private normalizeLabels(labels: string[] | undefined): string[] {
    return Array.from(
      new Set(
        (labels ?? [])
          .map((label) => label.trim())
          .filter((label) => label.length > 0),
      ),
    );
  }

  private async assertProjectKeepsOwner(projectId: string): Promise<void> {
    const ownerCount = await this.prisma.projectMember.count({
      where: { projectId, role: ProjectRole.OWNER },
    });
    if (ownerCount <= 1) {
      throw new BadRequestException('A project must keep at least one owner.');
    }
  }

  private parseSort(sort = 'createdAt:desc') {
    const [field, direction] = sort.split(':') as [string, 'asc' | 'desc'];
    if (!PROJECT_SORT_FIELDS.has(field)) {
      throw new BadRequestException(`Unsupported project sort field: ${field}`);
    }
    return { [field]: direction };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
