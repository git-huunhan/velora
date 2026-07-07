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
import {
  KanbanColumnResponse,
  ProjectMemberResponse,
  ProjectResponse,
  TaskResponse,
} from '../domain/contracts';
import { MoveColumnDto } from '../domain/dto/move-task.dto';
import { KanbanColumnListResponse } from './contracts/kanban-column-list.contract';
import { ProjectListResponse } from './contracts/project-list.contract';
import { ProjectMemberListResponse } from './contracts/project-member-list.contract';
import { TaskListResponse } from './contracts/task-list.contract';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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

  @Get(':id/columns')
  @ApiOperation({ summary: 'List workflow columns for a project' })
  @ApiOkResponse({ type: KanbanColumnListResponse })
  listColumns(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
  ): Promise<KanbanColumnListResponse> {
    return this.projectsService.listKanbanColumns(user.sub, projectId);
  }

  @Post(':id/columns')
  @ApiOperation({ summary: 'Create a workflow column' })
  @ApiCreatedResponse({ type: KanbanColumnResponse })
  createColumn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() input: CreateKanbanColumnDto,
  ): Promise<KanbanColumnResponse> {
    return this.projectsService.createKanbanColumn(user.sub, projectId, input);
  }

  @Patch(':id/columns/:columnId')
  @ApiOperation({ summary: 'Update workflow column metadata' })
  @ApiOkResponse({ type: KanbanColumnResponse })
  updateColumn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() input: UpdateKanbanColumnDto,
  ): Promise<KanbanColumnResponse> {
    return this.projectsService.updateKanbanColumn(
      user.sub,
      projectId,
      columnId,
      input,
    );
  }

  @Post(':id/columns/:columnId/move')
  @HttpCode(200)
  @ApiOperation({ summary: 'Move a workflow column' })
  @ApiOkResponse({ type: KanbanColumnResponse })
  moveColumn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('columnId', ParseUUIDPipe) columnId: string,
    @Body() input: MoveColumnDto,
  ): Promise<KanbanColumnResponse> {
    return this.projectsService.moveKanbanColumn(
      user.sub,
      projectId,
      columnId,
      input,
    );
  }

  @Delete(':id/columns/:columnId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an empty workflow column' })
  deleteColumn(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('columnId', ParseUUIDPipe) columnId: string,
  ): Promise<void> {
    return this.projectsService.deleteKanbanColumn(
      user.sub,
      projectId,
      columnId,
    );
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'List project tasks' })
  @ApiOkResponse({ type: TaskListResponse })
  listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
  ): Promise<TaskListResponse> {
    return this.projectsService.listTasks(user.sub, projectId);
  }

  @Post(':id/tasks')
  @ApiOperation({ summary: 'Create a project task' })
  @ApiCreatedResponse({ type: TaskResponse })
  createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() input: CreateTaskDto,
  ): Promise<TaskResponse> {
    return this.projectsService.createTask(user.sub, projectId, input);
  }

  @Get(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Get a project task' })
  @ApiOkResponse({ type: TaskResponse })
  getTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<TaskResponse> {
    return this.projectsService.getTask(user.sub, projectId, taskId);
  }

  @Patch(':id/tasks/:taskId')
  @ApiOperation({ summary: 'Update project task metadata' })
  @ApiOkResponse({ type: TaskResponse })
  updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() input: UpdateTaskDto,
  ): Promise<TaskResponse> {
    return this.projectsService.updateTask(user.sub, projectId, taskId, input);
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a project task without children' })
  deleteTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    return this.projectsService.deleteTask(user.sub, projectId, taskId);
  }
}
