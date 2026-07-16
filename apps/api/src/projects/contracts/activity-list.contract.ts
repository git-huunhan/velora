import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/contracts/pagination.contract';
import { ActivityResponse } from '../../domain/contracts';

export class ActivityListResponse {
  @ApiProperty({ type: ActivityResponse, isArray: true })
  data!: ActivityResponse[];
}

export class ProjectActivityListResponse extends ActivityListResponse {
  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
