import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
import { ProjectResponse } from '../domain/contracts';
import { ProjectListResponse } from './contracts/project-list.contract';
import { CreateProjectDto } from './dto/create-project.dto';
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
}
