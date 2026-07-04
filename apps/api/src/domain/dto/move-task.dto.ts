import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class MoveTaskDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetColumnId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf(
    (_object, value: unknown) => value !== null && value !== undefined,
  )
  @IsUUID()
  targetParentId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  beforeTaskId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  afterTaskId?: string;

  @ApiProperty({
    description: 'Task version used for optimistic concurrency checks.',
    format: 'date-time',
  })
  @IsISO8601({ strict: true })
  expectedUpdatedAt!: string;
}

export class MoveColumnDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  beforeColumnId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  afterColumnId?: string;

  @ApiProperty({
    description: 'Column version used for optimistic concurrency checks.',
    format: 'date-time',
  })
  @IsISO8601({ strict: true })
  expectedUpdatedAt!: string;
}
