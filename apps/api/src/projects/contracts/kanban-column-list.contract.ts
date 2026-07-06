import { ApiProperty } from '@nestjs/swagger';
import { KanbanColumnResponse } from '../../domain/contracts';

export class KanbanColumnListResponse {
  @ApiProperty({ type: KanbanColumnResponse, isArray: true })
  data!: KanbanColumnResponse[];
}
