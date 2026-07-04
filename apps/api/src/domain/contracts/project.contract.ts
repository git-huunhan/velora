import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole, ProjectStatus } from './enums';
import { UserSummary } from './user.contract';

export class ProjectResponse {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PRJ1' })
  key!: string;

  @ApiProperty({ example: 'Project 1' })
  name!: string;

  @ApiProperty({ example: 'Core workspace delivery' })
  description!: string;

  @ApiProperty({ enum: ProjectStatus })
  status!: ProjectStatus;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  startDate!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  endDate!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  archivedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class ProjectMemberResponse {
  @ApiProperty({ format: 'uuid' })
  projectId!: string;

  @ApiProperty({ enum: ProjectRole })
  role!: ProjectRole;

  @ApiProperty({ type: UserSummary })
  user!: UserSummary;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
