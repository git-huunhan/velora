import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type {
  NotificationReadAllResponse,
  NotificationUnreadCountResponse,
} from '../domain/contracts';
import { toNotificationResponse } from './notification.mapper';
import type { NotificationListResponse } from './contracts/notification-list.contract';
import type { NotificationListQueryDto } from './dto/notification-list-query.dto';

const notificationInclude = {
  actor: true,
  project: {
    select: {
      id: true,
      key: true,
      name: true,
    },
  },
  task: {
    select: {
      code: true,
      id: true,
      title: true,
    },
  },
} as const;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    query: NotificationListQueryDto,
  ): Promise<NotificationListResponse> {
    const page = query.page;
    const limit = query.limit;
    const unreadOnly = query.unread === 'true';
    const where = {
      recipientId: userId,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [total, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        include: notificationInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        where,
      }),
    ]);

    return {
      data: notifications.map(toNotificationResponse),
      meta: {
        limit,
        page,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getUnreadCount(
    userId: string,
  ): Promise<NotificationUnreadCountResponse> {
    const count = await this.prisma.notification.count({
      where: {
        readAt: null,
        recipientId: userId,
      },
    });

    return { count };
  }

  async markRead(userId: string, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      include: notificationInclude,
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    if (existing.readAt) {
      return toNotificationResponse(existing);
    }

    const updated = await this.prisma.notification.update({
      data: { readAt: new Date() },
      include: notificationInclude,
      where: { id: notificationId },
    });

    return toNotificationResponse(updated);
  }

  async markAllRead(userId: string): Promise<NotificationReadAllResponse> {
    const result = await this.prisma.notification.updateMany({
      data: { readAt: new Date() },
      where: {
        readAt: null,
        recipientId: userId,
      },
    });

    return { updatedCount: result.count };
  }
}
