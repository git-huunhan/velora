import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/contracts/pagination.contract';
import { UserResponse } from '../../domain/contracts';

export class UserListResponse {
  @ApiProperty({ type: UserResponse, isArray: true })
  data!: UserResponse[];

  @ApiProperty({ type: PaginationMeta })
  meta!: PaginationMeta;
}
