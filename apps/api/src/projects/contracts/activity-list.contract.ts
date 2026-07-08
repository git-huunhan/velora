import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponse } from '../../domain/contracts';

export class ActivityListResponse {
  @ApiProperty({ type: ActivityResponse, isArray: true })
  data!: ActivityResponse[];
}
