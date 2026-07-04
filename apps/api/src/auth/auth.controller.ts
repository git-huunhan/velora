import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from './access-token.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { AuthResponse, AuthTokensResponse } from './contracts/auth.contract';
import { CurrentUser } from './current-user.decorator';
import { UserResponse } from '../domain/contracts';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({ type: AuthResponse })
  register(@Body() input: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponse })
  login(@Body() input: LoginDto): Promise<AuthResponse> {
    return this.authService.login(input);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthTokensResponse })
  refresh(@Body() input: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.authService.refresh(input.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() input: RefreshTokenDto): Promise<void> {
    await this.authService.logout(input.refreshToken);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.authService.getUser(user.sub);
  }
}
