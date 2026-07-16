import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProjectActivityQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by task id.' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor user id.' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({ description: 'Filter by activity field/action.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @ApiPropertyOptional({
    description: 'Filter activity created at or after this ISO timestamp.',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter activity created before or at this ISO timestamp.',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
