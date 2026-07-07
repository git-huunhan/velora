import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TaskPriority, TaskType } from '../../domain/contracts/enums';

export class UpdateTaskDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  columnId?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf(
    (_object, value: unknown) => value !== null && value !== undefined,
  )
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ example: 'Build login form' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '' })
  @IsString()
  @MaxLength(4000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskType })
  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @ValidateIf(
    (_object, value: unknown) => value !== null && value !== undefined,
  )
  @IsUUID()
  assigneeId?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  labels?: string[];

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @ValidateIf(
    (_object, value: unknown) => value !== null && value !== undefined,
  )
  @IsISO8601({ strict: true })
  dueDate?: string | null;
}
