import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { ApiErrorResponse } from '../common/contracts/api-error.contract';
import { PaginationMeta } from '../common/contracts/pagination.contract';
import {
  AuthResponse,
  AuthTokensResponse,
} from '../auth/contracts/auth.contract';
import { UserListResponse } from '../users/contracts/user-list.contract';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { KanbanColumnListResponse } from '../projects/contracts/kanban-column-list.contract';
import { ProjectListResponse } from '../projects/contracts/project-list.contract';
import { ProjectMemberListResponse } from '../projects/contracts/project-member-list.contract';
import { AddProjectMemberDto } from '../projects/dto/add-project-member.dto';
import { CreateKanbanColumnDto } from '../projects/dto/create-kanban-column.dto';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import { UpdateKanbanColumnDto } from '../projects/dto/update-kanban-column.dto';
import { UpdateProjectMemberDto } from '../projects/dto/update-project-member.dto';
import { UpdateProjectDto } from '../projects/dto/update-project.dto';
import {
  ActivityResponse,
  CommentResponse,
  KanbanColumnResponse,
  ProjectMemberResponse,
  ProjectResponse,
  TaskResponse,
  UserResponse,
  UserSummary,
} from '../domain/contracts';
import { MoveColumnDto, MoveTaskDto } from '../domain/dto/move-task.dto';

export const OPENAPI_PATH = 'api/docs';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Velora API')
    .setDescription('REST API contracts for the Velora workspace platform.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config, {
    extraModels: [
      ActivityResponse,
      AddProjectMemberDto,
      ApiErrorResponse,
      AuthResponse,
      AuthTokensResponse,
      CommentResponse,
      CreateKanbanColumnDto,
      CreateProjectDto,
      KanbanColumnListResponse,
      KanbanColumnResponse,
      MoveColumnDto,
      MoveTaskDto,
      PaginationMeta,
      ProjectListResponse,
      ProjectMemberListResponse,
      ProjectMemberResponse,
      ProjectResponse,
      TaskResponse,
      UpdateKanbanColumnDto,
      UpdateProjectDto,
      UpdateProfileDto,
      UpdateProjectMemberDto,
      UserListResponse,
      UserResponse,
      UserSummary,
    ],
  });
}

export function configureSwagger(app: INestApplication): void {
  const documentFactory = () => createOpenApiDocument(app);

  SwaggerModule.setup(OPENAPI_PATH, app, documentFactory, {
    customSiteTitle: 'Velora API Documentation',
    jsonDocumentUrl: `${OPENAPI_PATH}-json`,
    yamlDocumentUrl: `${OPENAPI_PATH}-yaml`,
  });
}
