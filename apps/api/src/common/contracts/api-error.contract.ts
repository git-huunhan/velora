import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ example: 'Request validation failed' })
  message!: string;

  @ApiPropertyOptional({
    example: ['page must not be less than 1'],
    type: [String],
  })
  details?: unknown;

  @ApiProperty({ example: '2026-07-04T00:00:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: '7b47c1e5-1a2d-4f19-bad6-2d32d9f01777' })
  requestId?: string;

  @ApiProperty({ example: '/api/v1/projects?page=0' })
  path!: string;
}
