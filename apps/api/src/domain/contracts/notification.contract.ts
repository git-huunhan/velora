import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, TaskType } from './enums';
import { UserSummary } from './user.contract';

export class NotificationProjectSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Project 1' })
  name!: string;

  @ApiProperty({ example: 'PRJ1' })
  key!: string;
}

export class NotificationTaskSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PRJ1-125' })
  code!: string;

  @ApiProperty({ example: 'Build Project 1 workspace' })
  title!: string;

  @ApiProperty({ enum: TaskType })
  type!: TaskType;

  @ApiPropertyOptional({ example: 'To Do', nullable: true })
  columnName!: string | null;
}

export class NotificationResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: 'Task assigned to you' })
  title!: string;

  @ApiProperty({ example: 'Alex Smith assigned PRJ1-125 to you.' })
  message!: string;

  @ApiPropertyOptional({ nullable: true, type: UserSummary })
  actor!: UserSummary | null;

  @ApiPropertyOptional({ nullable: true, type: NotificationProjectSummary })
  project!: NotificationProjectSummary | null;

  @ApiPropertyOptional({ nullable: true, type: NotificationTaskSummary })
  task!: NotificationTaskSummary | null;

  @ApiPropertyOptional({ nullable: true, type: Object })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  readAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class NotificationUnreadCountResponse {
  @ApiProperty({ example: 3 })
  count!: number;
}

export class NotificationReadAllResponse {
  @ApiProperty({ example: 5 })
  updatedCount!: number;
}
