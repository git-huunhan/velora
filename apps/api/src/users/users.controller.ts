import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UserResponse } from '../domain/contracts';
import { UserListResponse } from './contracts/user-list.contract';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ type: UserResponse })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.usersService.getCurrentUser(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiOkResponse({ type: UserResponse })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateProfileDto,
  ): Promise<UserResponse> {
    return this.usersService.updateCurrentUser(user.sub, input);
  }

  @Get()
  @ApiOperation({ summary: 'List users for pickers and membership screens' })
  @ApiOkResponse({ type: UserListResponse })
  list(@Query() query: PaginationQueryDto): Promise<UserListResponse> {
    return this.usersService.listUsers(query);
  }
}
