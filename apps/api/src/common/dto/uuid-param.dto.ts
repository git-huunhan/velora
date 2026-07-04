import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @ApiProperty({
    example: '00000000-0000-4000-8000-000000000101',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;
}
