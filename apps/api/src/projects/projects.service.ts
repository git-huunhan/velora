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
import type { ProjectMemberListResponse } from './contracts/project-member-list.contract';
import type { AddProjectMemberDto } from './dto/add-project-member.dto';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
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
}
