import { ApiProperty } from '@nestjs/swagger';
import { TaskResponse } from '../../domain/contracts';

export class TaskListResponse {
  @ApiProperty({ type: TaskResponse, isArray: true })
  data!: TaskResponse[];
}
