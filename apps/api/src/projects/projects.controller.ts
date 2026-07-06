import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UuidParamDto } from '../common/dto/uuid-param.dto';
import { ProjectMemberResponse, ProjectResponse } from '../domain/contracts';
import { ProjectListResponse } from './contracts/project-list.contract';
import { ProjectMemberListResponse } from './contracts/project-member-list.contract';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects visible to the current user' })
  @ApiOkResponse({ type: ProjectListResponse })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ): Promise<ProjectListResponse> {
    return this.projectsService.listProjects(user.sub, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project with default workflow columns' })
  @ApiCreatedResponse({ type: ProjectResponse })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.createProject(user.sub, input);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by id' })
  @ApiOkResponse({ type: ProjectResponse })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: UuidParamDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.getProject(user.sub, params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project metadata' })
  @ApiOkResponse({ type: ProjectResponse })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: UuidParamDto,
    @Body() input: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateProject(user.sub, params.id, input);
  }

  @Post(':id/archive')
  @HttpCode(200)
  @ApiOperation({ summary: 'Archive a project' })
  @ApiOkResponse({ type: ProjectResponse })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: UuidParamDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.archiveProject(user.sub, params.id);
  }

  @Post(':id/unarchive')
  @HttpCode(200)
  @ApiOperation({ summary: 'Unarchive a project' })
  @ApiOkResponse({ type: ProjectResponse })
  unarchive(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: UuidParamDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.unarchiveProject(user.sub, params.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List project members' })
  @ApiOkResponse({ type: ProjectMemberListResponse })
  listMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectMemberListResponse> {
    return this.projectsService.listProjectMembers(user.sub, projectId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add a project member' })
  @ApiCreatedResponse({ type: ProjectMemberResponse })
  addMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() input: AddProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    return this.projectsService.addProjectMember(user.sub, projectId, input);
  }

  @Patch(':id/members/:memberUserId')
  @ApiOperation({ summary: 'Update a project member role' })
  @ApiOkResponse({ type: ProjectMemberResponse })
  updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('memberUserId', ParseUUIDPipe) memberUserId: string,
    @Body() input: UpdateProjectMemberDto,
  ): Promise<ProjectMemberResponse> {
    return this.projectsService.updateProjectMember(
      user.sub,
      projectId,
      memberUserId,
      input,
    );
  }

  @Delete(':id/members/:memberUserId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a project member' })
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('memberUserId', ParseUUIDPipe) memberUserId: string,
  ): Promise<void> {
    return this.projectsService.removeProjectMember(
      user.sub,
      projectId,
      memberUserId,
    );
  }
}
