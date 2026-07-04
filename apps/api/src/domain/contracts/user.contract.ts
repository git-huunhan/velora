import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from './enums';

export class UserSummary {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Admin Pro' })
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;
}

export class UserResponse extends UserSummary {
  @ApiProperty({ example: 'admin@velora.local', format: 'email' })
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
