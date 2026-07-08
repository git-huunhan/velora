import type { ActivityResponse } from '../domain/contracts';
import type { Activity, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

type ActivityWithActor = Activity & { actor: User };

export function toActivityResponse(
  activity: ActivityWithActor,
): ActivityResponse {
  return {
    actor: toUserSummary(activity.actor),
    createdAt: activity.createdAt.toISOString(),
    field: activity.field,
    from: activity.from,
    id: activity.id,
    taskId: activity.taskId,
    to: activity.to,
  };
}
