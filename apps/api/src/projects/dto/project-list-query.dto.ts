import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ProjectStatus } from '../../domain/contracts/enums';

const projectListStatuses = [...Object.values(ProjectStatus), 'archived'];

export class ProjectListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: projectListStatuses })
  @IsOptional()
  @IsIn(projectListStatuses)
  status?: ProjectStatus | 'archived';
}
