import type { ActivityResponse } from '../domain/contracts';
import type { Activity, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

type ActivityWithActor = Activity & { actor: User };

export function toActivityResponse(
  activity: ActivityWithActor,
  snapshots: { fromUser?: User | null; toUser?: User | null } = {},
): ActivityResponse {
  return {
    actor: toUserSummary(activity.actor),
    createdAt: activity.createdAt.toISOString(),
    field: activity.field,
    from: activity.from,
    fromUser: snapshots.fromUser ? toUserSummary(snapshots.fromUser) : null,
    id: activity.id,
    taskId: activity.taskId,
    to: activity.to,
    toUser: snapshots.toUser ? toUserSummary(snapshots.toUser) : null,
  };
}
