import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/contracts/pagination.contract';
import { NotificationResponse } from '../../domain/contracts';

export class NotificationListResponse {
  @ApiProperty({ type: NotificationResponse, isArray: true })
  data!: NotificationResponse[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
