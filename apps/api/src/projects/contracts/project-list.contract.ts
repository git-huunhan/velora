import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/contracts/pagination.contract';
import { ProjectResponse } from '../../domain/contracts';

export class ProjectListResponse {
  @ApiProperty({ type: ProjectResponse, isArray: true })
  data!: ProjectResponse[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
