import { ApiProperty } from '@nestjs/swagger';
import { CommentResponse } from '../../domain/contracts';

export class CommentListResponse {
  @ApiProperty({ type: CommentResponse, isArray: true })
  data!: CommentResponse[];
}
