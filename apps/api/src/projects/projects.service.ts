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
} from '../domain/contracts/enums';
import {
  hasProjectPermission,
  ProjectPermission,
} from '../domain/policies/project-permission.policy';
import { validateMoveAnchors } from '../domain/policies/ordering.policy';
import { PrismaService } from '../database/prisma.service';
import {
  ProjectRole,
  ProjectStatus as PrismaProjectStatus,
  type Prisma,
} from '../generated/prisma/client';
import type { MoveColumnDto } from '../domain/dto/move-task.dto';
import type { KanbanColumnListResponse } from './contracts/kanban-column-list.contract';
import type { ProjectListResponse } from './contracts/project-list.contract';
import type { ProjectMemberListResponse } from './contracts/project-member-list.contract';
import type { AddProjectMemberDto } from './dto/add-project-member.dto';
import type { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import type { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { toKanbanColumnResponse } from './kanban-column.mapper';
import { toProjectMemberResponse } from './project-member.mapper';
import { toProjectResponse } from './project.mapper';

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

function columnRankAt(index: number): string {
  return `a${String(index).padStart(6, '0')}`;
}

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
