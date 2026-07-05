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
import { PrismaService } from '../database/prisma.service';
import {
  ProjectRole,
  ProjectStatus as PrismaProjectStatus,
  type Prisma,
} from '../generated/prisma/client';
import type { ProjectListResponse } from './contracts/project-list.contract';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
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

  private parseSort(sort = 'createdAt:desc') {
    const [field, direction] = sort.split(':') as [string, 'asc' | 'desc'];
    if (!PROJECT_SORT_FIELDS.has(field)) {
      throw new BadRequestException(`Unsupported project sort field: ${field}`);
    }
    return { [field]: direction };
  }
}
