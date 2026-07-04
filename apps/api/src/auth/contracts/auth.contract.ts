import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../domain/contracts';

export class AuthTokensResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthResponse extends AuthTokensResponse {
  @ApiProperty({ type: UserResponse })
  user!: UserResponse;
}
