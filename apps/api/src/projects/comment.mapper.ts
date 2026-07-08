import type { CommentResponse } from '../domain/contracts';
import type { Comment, User } from '../generated/prisma/client';
import { toUserSummary } from '../users/user.mapper';

type CommentWithAuthor = Comment & { author: User };

export function toCommentResponse(comment: CommentWithAuthor): CommentResponse {
  return {
    author: toUserSummary(comment.author),
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    id: comment.id,
    taskId: comment.taskId,
    updatedAt: comment.updatedAt.toISOString(),
  };
}
