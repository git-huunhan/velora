import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AccessTokenPayload } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import type {
  ProjectSubscriptionPayload,
  RealtimeAck,
  RealtimeEvent,
} from './realtime.contract';
import { RealtimeRegistryService } from './realtime-registry.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@WebSocketGateway({
  cors: {
    origin: /^http:\/\/localhost:\d+$/,
  },
  namespace: 'realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly registry: RealtimeRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticate(client);
      this.registry.addConnection(client.id, user.sub);
      await client.join(this.userRoom(user.sub));
      client.emit('realtime.ready', {
        connectedAt: new Date().toISOString(),
        userId: user.sub,
      });
    } catch {
      client.emit('realtime.error', { message: 'Authentication is required.' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.registry.removeConnection(client.id);
  }

  @SubscribeMessage('project.subscribe')
  async subscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ProjectSubscriptionPayload,
  ): Promise<RealtimeAck> {
    if (!this.registry.getConnection(client.id)) {
      return { ok: false, error: 'UNAUTHENTICATED' };
    }
    if (!this.isValidProjectId(payload?.projectId)) {
      return { ok: false, error: 'INVALID_PROJECT_ID' };
    }

    const connection = this.registry.getConnection(client.id);
    const hasAccess = await this.hasProjectAccess(
      connection.userId,
      payload.projectId,
    );
    if (!hasAccess) {
      return { ok: false, error: 'FORBIDDEN' };
    }

    this.registry.subscribeProject(client.id, payload.projectId);
    await client.join(this.projectRoom(payload.projectId));
    return { ok: true };
  }

  @SubscribeMessage('project.unsubscribe')
  async unsubscribeProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ProjectSubscriptionPayload,
  ): Promise<RealtimeAck> {
    if (!this.registry.getConnection(client.id)) {
      return { ok: false, error: 'UNAUTHENTICATED' };
    }
    if (!this.isValidProjectId(payload?.projectId)) {
      return { ok: false, error: 'INVALID_PROJECT_ID' };
    }

    this.registry.unsubscribeProject(client.id, payload.projectId);
    await client.leave(this.projectRoom(payload.projectId));
    return { ok: true };
  }

  emitToUser(userId: string, event: RealtimeEvent): void {
    this.server.to(this.userRoom(userId)).emit('realtime.event', event);
  }

  emitToProject(projectId: string, event: RealtimeEvent): void {
    this.server.to(this.projectRoom(projectId)).emit('realtime.event', event);
  }

  removeUserFromProject(projectId: string, userId: string): void {
    const socketIds = this.registry.unsubscribeUserFromProject(
      userId,
      projectId,
    );
    if (socketIds.length === 0) return;

    this.server.in(socketIds).socketsLeave(this.projectRoom(projectId));
  }

  private async hasProjectAccess(
    userId: string,
    projectId: string,
  ): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { userId: true },
    });
    return Boolean(member);
  }

  private async authenticate(client: Socket): Promise<AccessTokenPayload> {
    const token = this.extractToken(client);
    if (!token) throw new UnauthorizedException('Authentication is required.');
    return this.jwtService.verifyAsync<AccessTokenPayload>(token);
  }

  private extractToken(client: Socket): string | undefined {
    const authToken: unknown = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken.trim()) return authToken;

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization !== 'string') return undefined;

    const [scheme, token] = authorization.split(' ');
    if (scheme === 'Bearer' && token) return token;

    return undefined;
  }

  private isValidProjectId(projectId: string | undefined): projectId is string {
    return typeof projectId === 'string' && UUID_PATTERN.test(projectId);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private projectRoom(projectId: string): string {
    return `project:${projectId}`;
  }
}
