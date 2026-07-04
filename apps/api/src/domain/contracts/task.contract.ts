import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskType } from './enums';
import { UserSummary } from './user.contract';

export class KanbanColumnResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({ example: 'In Progress' })
  name!: string;

  @ApiProperty({ example: 'a1' })
  rank!: string;

  @ApiProperty({ default: false })
  isDone!: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class TaskResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({ format: 'uuid' })
  columnId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ example: 'PRJ1-125' })
  code!: string;

  @ApiProperty({ example: 'Build Project 1 workspace' })
  title!: string;

  @ApiProperty({ example: '' })
  description!: string;

  @ApiProperty({ enum: TaskType })
  type!: TaskType;

  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;

  @ApiProperty({ example: 'a1' })
  rank!: string;

  @ApiPropertyOptional({ type: UserSummary, nullable: true })
  assignee!: UserSummary | null;

  @ApiPropertyOptional({ type: UserSummary, nullable: true })
  reporter!: UserSummary | null;

  @ApiProperty({ example: ['Frontend'], type: [String] })
  labels!: string[];

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  dueDate!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
