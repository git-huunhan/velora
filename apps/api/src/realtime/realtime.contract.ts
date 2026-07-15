export type RealtimeEventType =
  | 'notification.created'
  | 'task.updated'
  | 'task.moved'
  | 'task.commented'
  | 'project.member_added'
  | 'project.member_removed'
  | 'project.updated'
  | 'presence.changed';

export interface RealtimeEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;
  version: 1;
  type: RealtimeEventType;
  actorId?: string | null;
  projectId?: string;
  taskId?: string;
  recipientId?: string;
  payload: TPayload;
  createdAt: string;
}

export interface ProjectSubscriptionPayload {
  projectId: string;
}

export interface RealtimeAck {
  ok: boolean;
  error?: string;
}
