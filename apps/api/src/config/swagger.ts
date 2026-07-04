import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorResponse } from '../common/contracts/api-error.contract';
import { PaginationMeta } from '../common/contracts/pagination.contract';
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

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Velora API')
    .setDescription('REST API contracts for the Velora workspace platform.')
    .setVersion('1.0')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      extraModels: [
        ActivityResponse,
        ApiErrorResponse,
        CommentResponse,
        KanbanColumnResponse,
        MoveColumnDto,
        MoveTaskDto,
        PaginationMeta,
        ProjectMemberResponse,
        ProjectResponse,
        TaskResponse,
        UserResponse,
        UserSummary,
      ],
    });

  SwaggerModule.setup(OPENAPI_PATH, app, documentFactory, {
    customSiteTitle: 'Velora API Documentation',
    jsonDocumentUrl: `${OPENAPI_PATH}-json`,
    yamlDocumentUrl: `${OPENAPI_PATH}-yaml`,
  });
}
