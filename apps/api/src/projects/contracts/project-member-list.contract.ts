import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberResponse } from '../../domain/contracts';

export class ProjectMemberListResponse {
  @ApiProperty({ type: ProjectMemberResponse, isArray: true })
  data!: ProjectMemberResponse[];
}
