import { io, type Socket } from "socket.io-client";

import { getAccessToken } from "./client";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const REALTIME_BASE_URL = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

let socket: Socket | null = null;

export type RealtimeEventType =
  | "notification.created"
  | "task.updated"
  | "task.moved"
  | "task.commented"
  | "project.member_added"
  | "project.member_removed"
  | "project.updated"
  | "presence.changed";

export interface RealtimeEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  actorId?: string | null;
  createdAt: string;
  id: string;
  payload: TPayload;
  projectId?: string;
  recipientId?: string;
  taskId?: string;
  type: RealtimeEventType;
  version: 1;
}

export function getRealtimeSocket() {
  socket ??= io(`${REALTIME_BASE_URL}/realtime`, {
    autoConnect: false,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    transports: ["websocket"],
  });

  return socket;
}

export function connectRealtimeSocket() {
  const token = getAccessToken();
  if (!token) return null;

  const realtimeSocket = getRealtimeSocket();
  realtimeSocket.auth = { token };

  if (!realtimeSocket.connected) {
    realtimeSocket.connect();
  }

  return realtimeSocket;
}

export function subscribeToProject(projectId: string) {
  const realtimeSocket = connectRealtimeSocket();
  realtimeSocket?.emit("project.subscribe", { projectId });
  return realtimeSocket;
}

export function unsubscribeFromProject(projectId: string) {
  socket?.emit("project.unsubscribe", { projectId });
}

export function disconnectRealtimeSocket() {
  socket?.disconnect();
}
