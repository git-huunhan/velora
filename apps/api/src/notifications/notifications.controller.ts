import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  NotificationReadAllResponse,
  NotificationResponse,
  NotificationUnreadCountResponse,
} from '../domain/contracts';
import { NotificationListResponse } from './contracts/notification-list.contract';
import { NotificationListQueryDto } from './dto/notification-list-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ type: NotificationListResponse })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationListQueryDto,
  ): Promise<NotificationListResponse> {
    return this.notificationsService.listForUser(user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count for the current user',
  })
  @ApiOkResponse({ type: NotificationUnreadCountResponse })
  unreadCount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationUnreadCountResponse> {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Post(':id/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiOkResponse({ type: NotificationResponse })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationResponse> {
    return this.notificationsService.markRead(user.sub, notificationId);
  }

  @Post('read-all')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark all current-user notifications as read' })
  @ApiOkResponse({ type: NotificationReadAllResponse })
  markAllRead(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationReadAllResponse> {
    return this.notificationsService.markAllRead(user.sub);
  }
}
