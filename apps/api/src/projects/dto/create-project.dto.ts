import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'APP', minLength: 2, maxLength: 12 })
  @IsString()
  @Length(2, 12)
  @Matches(/^[A-Z][A-Z0-9]*$/)
  key!: string;

  @ApiProperty({ example: 'Mobile App', minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/project.png',
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  avatarUrl?: string | null;
}
