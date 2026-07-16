import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { RealtimeEventType } from '../realtime/realtime.contract';
import {
  NotificationType,
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
import type { ProjectListQueryDto } from './dto/project-list-query.dto';
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
  OWNER: ApiProjectRole.ADMIN,
  VIEWER: ApiProjectRole.VIEWER,
} as const;
const roleToPrisma = {
  [ApiProjectRole.ADMIN]: ProjectRole.OWNER,
  [ApiProjectRole.MEMBER]: ProjectRole.MEMBER,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private emitProjectEvent(
    type: RealtimeEventType,
    actorId: string,
    projectId: string,
    payload: Record<string, unknown>,
    taskId?: string,
  ) {
    this.realtimeGateway.emitToProject(projectId, {
      actorId,
      createdAt: new Date().toISOString(),
      id: randomUUID(),
      payload,
      projectId,
      taskId,
      type,
      version: 1,
    });
  }

  async listProjects(
    userId: string,
    query: ProjectListQueryDto,
  ): Promise<ProjectListResponse> {
    const sort = this.parseSort(query.sort);
    const search = query.search?.trim();
    const where: Prisma.ProjectWhereInput = {
      ...(query.status === 'archived'
        ? { archivedAt: { not: null } }
        : { archivedAt: null }),
      ...(query.status && query.status !== 'archived'
        ? { status: statusToPrisma[query.status] }
        : {}),
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

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data,
    });
    this.emitProjectEvent('project.updated', userId, projectId, {
      action: 'updated',
      projectId,
    });
    return toProjectResponse(updated);
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
    const archived = await this.prisma.$transaction(async (transaction) => {
      const updatedProject = await transaction.project.update({
        where: { id: projectId },
        data: { archivedAt: new Date() },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'project.archived',
        from: null,
        projectId,
        taskId: null,
        to: updatedProject.name,
      });
      return updatedProject;
    });
    this.emitProjectEvent('project.updated', userId, projectId, {
      action: 'archived',
      projectId,
    });
    return toProjectResponse(archived);
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
    const unarchived = await this.prisma.$transaction(async (transaction) => {
      const updatedProject = await transaction.project.update({
        where: { id: projectId },
        data: { archivedAt: null },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'project.restored',
        from: null,
        projectId,
        taskId: null,
        to: updatedProject.name,
      });
      return updatedProject;
    });
    this.emitProjectEvent('project.updated', userId, projectId, {
      action: 'unarchived',
      projectId,
    });
    return toProjectResponse(unarchived);
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
    const [members, assigneeCounts] = await Promise.all([
      this.prisma.projectMember.findMany({
        where: { projectId },
        include: { user: true },
        orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
      }),
      this.prisma.task.groupBy({
        by: ['assigneeId'],
        where: { projectId, assigneeId: { not: null } },
        _count: { _all: true },
      }),
    ]);
    const assignedTaskCountByUserId = new Map(
      assigneeCounts
        .filter((count) => count.assigneeId)
        .map((count) => [count.assigneeId, count._count._all]),
    );
    return {
      data: members.map((member) => ({
        ...toProjectMemberResponse(member),
        affectedAssignedTaskCount:
          assignedTaskCountByUserId.get(member.userId) ?? 0,
      })),
    };
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

    const { member, project } = await this.prisma.$transaction(
      async (transaction) => {
        const project = await transaction.project.findUniqueOrThrow({
          where: { id: projectId },
          select: { id: true, key: true, name: true },
        });
        const member = await transaction.projectMember.create({
          data: {
            projectId,
            role: roleToPrisma[input.role],
            userId: input.userId,
          },
          include: { user: true },
        });
        await this.createActivity(transaction, {
          actorId: userId,
          field: 'member.added',
          from: null,
          projectId,
          taskId: null,
          to: `${member.user.displayName}:${member.role}`,
        });
        return { member, project };
      },
    );

    await this.notifyProjectMemberAdded(userId, input.userId, project);
    this.emitProjectEvent('project.member_added', userId, projectId, {
      memberUserId: input.userId,
      projectId,
    });

    return toProjectMemberResponse(member);
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
    const member = await this.prisma.projectMember.findUniqueOrThrow({
      where: { projectId_userId: { projectId, userId: memberUserId } },
      include: { user: true },
    });
    if (
      member.role === ProjectRole.OWNER &&
      roleToPrisma[input.role] !== ProjectRole.OWNER
    ) {
      await this.assertProjectKeepsOwner(projectId);
    }

    const updatedMember = await this.prisma.$transaction(
      async (transaction) => {
        const updatedMember = await transaction.projectMember.update({
          where: { projectId_userId: { projectId, userId: memberUserId } },
          data: { role: roleToPrisma[input.role] },
          include: { user: true },
        });
        await this.createActivity(transaction, {
          actorId: userId,
          field: 'member.role',
          from: `${member.user.displayName}:${member.role}`,
          projectId,
          taskId: null,
          to: `${updatedMember.user.displayName}:${updatedMember.role}`,
        });
        return updatedMember;
      },
    );
    this.emitProjectEvent('project.member_added', userId, projectId, {
      action: 'role_updated',
      memberUserId,
      projectId,
    });
    return toProjectMemberResponse(updatedMember);
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
    const member = await this.prisma.projectMember.findUniqueOrThrow({
      where: { projectId_userId: { projectId, userId: memberUserId } },
      include: { user: true },
    });
    if (member.role === ProjectRole.OWNER) {
      await this.assertProjectKeepsOwner(projectId);
    }

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { id: true, key: true, name: true },
    });
    const assignedTasks = await this.prisma.task.findMany({
      where: { projectId, assigneeId: memberUserId },
      select: { id: true },
    });

    await this.prisma.$transaction(async (transaction) => {
      if (assignedTasks.length > 0) {
        await transaction.activity.createMany({
          data: assignedTasks.map((task) => ({
            actorId: userId,
            field: 'assigneeId',
            from: memberUserId,
            projectId,
            taskId: task.id,
            to: null,
          })),
        });
        await transaction.task.updateMany({
          where: { projectId, assigneeId: memberUserId },
          data: { assigneeId: null },
        });
      }

      await transaction.projectMember.delete({
        where: { projectId_userId: { projectId, userId: memberUserId } },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'member.removed',
        from: member.user.displayName,
        projectId,
        taskId: null,
        to: member.role,
      });
    });

    await this.notifyProjectMemberRemoved(userId, memberUserId, project);
    this.realtimeGateway.removeUserFromProject(projectId, memberUserId);
    this.emitProjectEvent('project.member_removed', userId, projectId, {
      affectedTaskIds: assignedTasks.map((task) => task.id),
      memberUserId,
      projectId,
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
      const createdColumn = await this.prisma.$transaction(
        async (transaction) => {
          const createdColumn = await transaction.kanbanColumn.create({
            data: {
              isDone: input.isDone ?? false,
              name,
              projectId,
              rank: columnRankAt(count),
            },
          });
          await this.createActivity(transaction, {
            actorId: userId,
            field: 'column.created',
            from: null,
            projectId,
            taskId: null,
            to: createdColumn.name,
          });
          return createdColumn;
        },
      );
      this.emitProjectEvent('project.updated', userId, projectId, {
        action: 'column_created',
        columnId: createdColumn.id,
        projectId,
      });
      return toKanbanColumnResponse(createdColumn);
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
      const previousColumn = await this.getKanbanColumnOrThrow(
        projectId,
        columnId,
      );
      const updatedColumn = await this.prisma.$transaction(
        async (transaction) => {
          const updatedColumn = await transaction.kanbanColumn.update({
            where: { id: columnId },
            data: {
              ...(input.name !== undefined ? { name: input.name.trim() } : {}),
              ...(input.isDone !== undefined ? { isDone: input.isDone } : {}),
            },
          });
          await this.createActivity(transaction, {
            actorId: userId,
            field: 'column.updated',
            from: previousColumn.name,
            projectId,
            taskId: null,
            to: updatedColumn.name,
          });
          return updatedColumn;
        },
      );
      this.emitProjectEvent('project.updated', userId, projectId, {
        action: 'column_updated',
        columnId,
        projectId,
      });
      return toKanbanColumnResponse(updatedColumn);
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

    const originalIndex = columns.findIndex((column) => column.id === columnId);
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
          data: { rank: `tmp-${index}-${column.id}` },
        });
      }

      for (const [index, column] of reordered.entries()) {
        await transaction.kanbanColumn.update({
          where: { id: column.id },
          data: { rank: columnRankAt(index) },
        });
      }

      const updatedColumn = await transaction.kanbanColumn.findUniqueOrThrow({
        where: { id: columnId },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'column.moved',
        from: `position ${originalIndex + 1}`,
        projectId,
        taskId: null,
        to: `position ${insertIndex + 1}`,
      });
      return updatedColumn;
    });

    this.emitProjectEvent('project.updated', userId, projectId, {
      action: 'column_moved',
      columnId,
      projectId,
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

    const deletedColumn = await this.getKanbanColumnOrThrow(
      projectId,
      columnId,
    );
    await this.prisma.$transaction(async (transaction) => {
      await transaction.kanbanColumn.delete({ where: { id: columnId } });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'column.deleted',
        from: deletedColumn.name,
        projectId,
        taskId: null,
        to: null,
      });
    });
    this.emitProjectEvent('project.updated', userId, projectId, {
      action: 'column_deleted',
      columnId,
      projectId,
    });
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
          title: input.title.trim(),
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          labels: this.normalizeLabels(input.labels),
          parentId,
          priority: priorityToPrisma[input.priority ?? ApiTaskPriority.MEDIUM],
          projectId,
          rank,
          reporterId: userId,
          type: taskTypeToPrisma[type],
        },
        include: { assignee: true, reporter: true },
      });
      await this.createActivity(transaction, {
        actorId: userId,
        field: 'created',
        from: null,
        projectId,
        taskId: createdTask.id,
        to: createdTask.code,
      });
      return createdTask;
    });
    await this.notifyTaskAssigned(userId, null, task);
    await this.notifyTaskChildCreated(userId, parentId, task);
    this.emitProjectEvent(
      'task.updated',
      userId,
      projectId,
      { action: 'created', taskId: task.id },
      task.id,
    );
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
    if (input.reporterId) {
      await this.assertProjectMemberExists(projectId, input.reporterId);
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
      if (input.columnId !== existing.columnId) {
        data.rank = await this.nextTaskRank(input.columnId);
      }
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
    if (input.reporterId !== undefined) {
      data.reporter = input.reporterId
        ? { connect: { id: input.reporterId } }
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
        projectId,
        taskId,
        this.collectTaskUpdateActivities(existing, updatedTask),
      );
      return updatedTask;
    });

    await this.notifyTaskAssigned(userId, existing.assigneeId, updated);
    await this.notifyTaskStatusChanged(userId, existing, updated);
    this.emitProjectEvent(
      'task.updated',
      userId,
      projectId,
      { action: 'updated', taskId: updated.id },
      updated.id,
    );
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
        projectId,
        taskId,
        this.collectTaskUpdateActivities(movingTask, movedTask),
      );
      return movedTask;
    });

    await this.notifyTaskStatusChanged(userId, movingTask, moved);
    this.emitProjectEvent(
      'task.moved',
      userId,
      projectId,
      {
        action: 'moved',
        targetColumnId: moved.columnId,
        targetParentId: moved.parentId,
        taskId: moved.id,
      },
      moved.id,
    );
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
    const task = await this.getTaskOrThrow(projectId, taskId);

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
        projectId,
        taskId,
        to: createdComment.body,
      });
      return createdComment;
    });

    await this.notifyTaskCommented(userId, task);
    this.emitProjectEvent(
      'task.commented',
      userId,
      projectId,
      { action: 'commented', commentId: comment.id, taskId },
      taskId,
    );
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
    const userIdPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const referencedUserIds = Array.from(
      new Set(
        activities
          .flatMap((activity) => [activity.from, activity.to])
          .filter(
            (value): value is string => !!value && userIdPattern.test(value),
          ),
      ),
    );
    const referencedUsers = referencedUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: referencedUserIds } },
        })
      : [];
    const referencedUserById = new Map(
      referencedUsers.map((user) => [user.id, user]),
    );

    return {
      data: activities.map((activity) =>
        toActivityResponse(activity, {
          fromUser: activity.from
            ? referencedUserById.get(activity.from)
            : undefined,
          toUser: activity.to ? referencedUserById.get(activity.to) : undefined,
        }),
      ),
    };
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

  private async notifyProjectMemberAdded(
    actorId: string,
    recipientId: string,
    project: { id: string; key: string; name: string },
  ): Promise<void> {
    await this.notificationsService.createForRecipient({
      actorId,
      metadata: { projectKey: project.key, projectName: project.name },
      projectId: project.id,
      recipientId,
      type: NotificationType.PROJECT_MEMBER_ADDED,
    });
  }

  private async notifyProjectMemberRemoved(
    actorId: string,
    recipientId: string,
    project: { id: string; key: string; name: string },
  ): Promise<void> {
    await this.notificationsService.createForRecipient({
      actorId,
      metadata: { projectKey: project.key, projectName: project.name },
      projectId: project.id,
      recipientId,
      type: NotificationType.PROJECT_MEMBER_REMOVED,
    });
  }

  private async notifyTaskChildCreated(
    actorId: string,
    parentId: string | null,
    task: {
      code: string;
      columnId: string;
      id: string;
      projectId: string;
      title: string;
      type: PrismaTaskType;
    },
  ): Promise<void> {
    if (!parentId) return;

    const parent = await this.prisma.task.findFirst({
      where: { id: parentId, projectId: task.projectId },
      select: {
        assigneeId: true,
        code: true,
        reporterId: true,
        title: true,
      },
    });
    if (!parent) return;

    const childLabel =
      task.type === PrismaTaskType.SUBTASK ? 'subtask' : 'work item';

    await this.notificationsService.createForRecipients({
      actorId,
      metadata: {
        childType: childLabel,
        columnName: await this.getColumnName(task.projectId, task.columnId),
        parentCode: parent.code,
        parentTitle: parent.title,
        projectName: await this.getProjectName(task.projectId),
        taskCode: task.code,
        taskTitle: task.title,
        taskType: taskTypeToApi[task.type],
      },
      projectId: task.projectId,
      recipientIds: [parent.assigneeId, parent.reporterId],
      taskId: task.id,
      type: NotificationType.TASK_CHILD_CREATED,
    });
  }

  private async notifyTaskAssigned(
    actorId: string,
    previousAssigneeId: string | null,
    task: {
      assigneeId: string | null;
      code: string;
      columnId: string;
      id: string;
      projectId: string;
      title: string;
      type: PrismaTaskType;
    },
  ): Promise<void> {
    if (task.assigneeId === previousAssigneeId) return;

    const columnName = await this.getColumnName(task.projectId, task.columnId);
    const projectName = await this.getProjectName(task.projectId);
    const nextAssigneeName = task.assigneeId
      ? await this.getUserDisplayName(task.assigneeId)
      : null;
    const taskSnapshot = {
      columnName,
      projectName,
      taskCode: task.code,
      taskTitle: task.title,
      taskType: taskTypeToApi[task.type],
    };

    if (previousAssigneeId && previousAssigneeId !== actorId) {
      await this.notificationsService.createForRecipient({
        actorId,
        metadata: {
          ...taskSnapshot,
          assigneeName: nextAssigneeName,
        },
        projectId: task.projectId,
        recipientId: previousAssigneeId,
        taskId: task.id,
        type: NotificationType.TASK_UNASSIGNED,
      });
    }

    if (!task.assigneeId) return;

    await this.notificationsService.createForRecipient({
      actorId,
      metadata: taskSnapshot,
      projectId: task.projectId,
      recipientId: task.assigneeId,
      taskId: task.id,
      type: NotificationType.TASK_ASSIGNED,
    });
  }

  private async notifyTaskCommented(
    actorId: string,
    task: {
      assigneeId: string | null;
      code: string;
      columnId: string;
      id: string;
      projectId: string;
      reporterId: string | null;
      title: string;
      type: PrismaTaskType;
    },
  ): Promise<void> {
    await this.notificationsService.createForRecipients({
      actorId,
      metadata: {
        columnName: await this.getColumnName(task.projectId, task.columnId),
        projectName: await this.getProjectName(task.projectId),
        taskCode: task.code,
        taskTitle: task.title,
        taskType: taskTypeToApi[task.type],
      },
      projectId: task.projectId,
      recipientIds: [task.assigneeId, task.reporterId],
      taskId: task.id,
      type: NotificationType.TASK_COMMENTED,
    });
  }

  private async notifyTaskStatusChanged(
    actorId: string,
    previous: {
      columnId: string;
    },
    task: {
      assigneeId: string | null;
      code: string;
      columnId: string;
      id: string;
      projectId: string;
      reporterId: string | null;
      title: string;
      type: PrismaTaskType;
    },
  ): Promise<void> {
    if (previous.columnId === task.columnId) return;

    await this.notificationsService.createForRecipients({
      actorId,
      metadata: {
        fromColumnId: previous.columnId,
        fromColumnName: await this.getColumnName(
          task.projectId,
          previous.columnId,
        ),
        projectName: await this.getProjectName(task.projectId),
        taskCode: task.code,
        taskTitle: task.title,
        taskType: taskTypeToApi[task.type],
        toColumnId: task.columnId,
        toColumnName: await this.getColumnName(task.projectId, task.columnId),
      },
      projectId: task.projectId,
      recipientIds: [task.assigneeId, task.reporterId],
      taskId: task.id,
      type: NotificationType.TASK_STATUS_CHANGED,
    });
  }

  private async getProjectName(projectId: string): Promise<string | null> {
    const project = await this.prisma.project.findUnique({
      select: { name: true },
      where: { id: projectId },
    });
    return project?.name ?? null;
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

  private async getColumnName(
    projectId: string,
    columnId: string,
  ): Promise<string | null> {
    const column = await this.prisma.kanbanColumn.findUnique({
      select: { name: true, projectId: true },
      where: { id: columnId },
    });
    return column?.projectId === projectId ? column.name : null;
  }

  private async getUserDisplayName(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      select: { displayName: true },
      where: { id: userId },
    });
    return user?.displayName ?? null;
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
      reporterId: string | null;
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
      reporterId: string | null;
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
        field: 'reporterId',
        from: previous.reporterId,
        to: next.reporterId,
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
    projectId: string,
    taskId: string,
    changes: ActivityChange[],
  ): Promise<void> {
    for (const change of changes) {
      await this.createActivity(transaction, {
        actorId,
        field: change.field,
        from: change.from,
        projectId,
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
      projectId: string;
      taskId: string | null;
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
