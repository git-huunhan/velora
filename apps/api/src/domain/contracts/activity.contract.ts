import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserSummary } from './user.contract';

export class CommentResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  taskId!: string;

  @ApiProperty({ type: UserSummary })
  author!: UserSummary;

  @ApiProperty()
  body!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class ActivityResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  taskId!: string | null;

  @ApiProperty({ type: UserSummary })
  actor!: UserSummary;

  @ApiProperty({ example: 'status' })
  field!: string;

  @ApiPropertyOptional({ nullable: true })
  from!: string | null;

  @ApiPropertyOptional({ nullable: true })
  to!: string | null;

  @ApiPropertyOptional({ type: UserSummary, nullable: true })
  fromUser?: UserSummary | null;

  @ApiPropertyOptional({ type: UserSummary, nullable: true })
  toUser?: UserSummary | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
