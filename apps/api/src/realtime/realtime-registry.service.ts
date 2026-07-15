import { Injectable } from '@nestjs/common';

export interface RealtimeConnection {
  socketId: string;
  userId: string;
  projectIds: Set<string>;
}

@Injectable()
export class RealtimeRegistryService {
  private readonly connections = new Map<string, RealtimeConnection>();
  private readonly userSockets = new Map<string, Set<string>>();
  private readonly projectSockets = new Map<string, Set<string>>();

  addConnection(socketId: string, userId: string): void {
    this.removeConnection(socketId);

    this.connections.set(socketId, {
      socketId,
      userId,
      projectIds: new Set<string>(),
    });

    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socketId);
    this.userSockets.set(userId, sockets);
  }

  subscribeProject(socketId: string, projectId: string): boolean {
    const connection = this.connections.get(socketId);
    if (!connection) return false;

    connection.projectIds.add(projectId);
    const sockets = this.projectSockets.get(projectId) ?? new Set<string>();
    sockets.add(socketId);
    this.projectSockets.set(projectId, sockets);
    return true;
  }

  unsubscribeProject(socketId: string, projectId: string): boolean {
    const connection = this.connections.get(socketId);
    if (!connection) return false;

    connection.projectIds.delete(projectId);
    const sockets = this.projectSockets.get(projectId);
    sockets?.delete(socketId);
    if (sockets?.size === 0) this.projectSockets.delete(projectId);
    return true;
  }

  unsubscribeUserFromProject(userId: string, projectId: string): string[] {
    const socketIds = this.getUserSocketIds(userId);
    const removedSocketIds: string[] = [];

    for (const socketId of socketIds) {
      if (this.unsubscribeProject(socketId, projectId)) {
        removedSocketIds.push(socketId);
      }
    }

    return removedSocketIds;
  }

  removeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (!connection) return;

    this.connections.delete(socketId);

    const userSockets = this.userSockets.get(connection.userId);
    userSockets?.delete(socketId);
    if (userSockets?.size === 0) this.userSockets.delete(connection.userId);

    for (const projectId of connection.projectIds) {
      const projectSockets = this.projectSockets.get(projectId);
      projectSockets?.delete(socketId);
      if (projectSockets?.size === 0) this.projectSockets.delete(projectId);
    }
  }

  getConnection(socketId: string): RealtimeConnection | undefined {
    return this.connections.get(socketId);
  }

  getUserSocketIds(userId: string): string[] {
    return Array.from(this.userSockets.get(userId) ?? []);
  }

  getProjectSocketIds(projectId: string): string[] {
    return Array.from(this.projectSockets.get(projectId) ?? []);
  }
}
