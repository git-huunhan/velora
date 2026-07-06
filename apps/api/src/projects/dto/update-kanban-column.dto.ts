import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateKanbanColumnDto {
  @ApiPropertyOptional({ example: 'Ready for Review' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;
}
