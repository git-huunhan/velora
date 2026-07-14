import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { NotificationType, Prisma } from '../generated/prisma/client';
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
      column: {
        select: {
          name: true,
        },
      },
      id: true,
      title: true,
      type: true,
    },
  },
} as const;
interface CreateNotificationInput {
  actorId?: string | null;
  metadata?: Record<string, unknown> | null;
  projectId?: string | null;
  recipientId: string;
  taskId?: string | null;
  type: NotificationType;
}

interface CreateNotificationForRecipientsInput extends Omit<
  CreateNotificationInput,
  'recipientId'
> {
  recipientIds: Array<string | null | undefined>;
}
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
  async createForRecipient(
    input: CreateNotificationInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    if (input.actorId && input.actorId === input.recipientId) return;

    await client.notification.create({
      data: {
        actorId: input.actorId ?? null,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        projectId: input.projectId ?? null,
        recipientId: input.recipientId,
        taskId: input.taskId ?? null,
        type: input.type,
      },
    });
  }

  async createForRecipients(
    input: CreateNotificationForRecipientsInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const recipientIds = Array.from(
      new Set(input.recipientIds.filter((id): id is string => Boolean(id))),
    );

    for (const recipientId of recipientIds) {
      await this.createForRecipient({ ...input, recipientId }, client);
    }
  }
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
