import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowEIO3: true,
  },
  transports: ['websocket', 'polling'],
})
export class MessagingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
    // Enable binary data support
    server.engine.on('connection', (rawSocket: any) => {
      const socketId: string =
        (rawSocket as Record<string, any>)?.id ?? 'unknown';
      this.logger.debug(`New WebSocket connection from ${socketId}`);
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', {
      status: 'connected',
      message: 'Welcome to messaging',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client joins a claim chat room
   */
  @SubscribeMessage('join-claim-room')
  async handleJoinRoom(
    @MessageBody() data: { claimId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = `claim-${data.claimId}`;
      await client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
      client.emit('room-joined', {
        event: 'joined',
        room,
        claimId: data.claimId,
      });
      return { event: 'joined', room };
    } catch (error: any) {
      const errorMsg: string =
        (error as Record<string, any>)?.message ?? 'Unknown error';
      this.logger.error(`Failed to join room: ${errorMsg}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Client leaves a claim chat room
   */
  @SubscribeMessage('leave-claim-room')
  async handleLeaveRoom(
    @MessageBody() data: { claimId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = `claim-${data.claimId}`;
      await client.leave(room);
      this.logger.log(`Client ${client.id} left room ${room}`);
      return { event: 'left', room };
    } catch (error: any) {
      const errorMsg =
        (error as Record<string, any>)?.message ?? 'Unknown error';
      this.logger.error(`Failed to leave room: ${errorMsg}`);
    }
  }

  /**
   * Typing indicator — broadcast to claim room (excluding sender)
   */
  @SubscribeMessage('user-typing')
  handleTyping(
    @MessageBody() data: { claimId: string; userId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `claim-${data.claimId}`;
    client.to(room).emit('user-typing', {
      claimId: data.claimId,
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }

  /**
   * Emit new message to claim room (called from service layer)
   */
  emitNewMessage(claimId: string, message: any): void {
    try {
      const room = `claim-${claimId}`;
      const messageId = (message as Record<string, any>)?.id ?? 'unknown';
      this.logger.debug(
        `Emitting message to room ${room}: ${String(messageId)}`,
      );
      this.server.to(room).emit('claim-message-new', message);
      // Also log to verify emission
      const roomSockets =
        this.server.sockets.adapter.rooms.get(room)?.size ?? 0;
      this.logger.debug(`Message emitted to ${roomSockets} clients in ${room}`);
    } catch (error: any) {
      const errorMsg =
        (error as Record<string, any>)?.message ?? 'Unknown error';
      this.logger.error(`Failed to emit message: ${errorMsg}`);
    }
  }

  /**
   * Emit read receipt to claim room (called from service layer)
   */
  emitMessageRead(claimId: string, readBy: string, markedCount: number): void {
    try {
      const room = `claim-${claimId}`;
      this.logger.debug(`Emitting read receipt to room ${room}`);
      this.server.to(room).emit('claim-message-read', {
        claimId,
        readBy,
        readAt: new Date().toISOString(),
        markedCount,
      });
    } catch (error: any) {
      const errorMsg =
        (error as Record<string, any>)?.message ?? 'Unknown error';
      this.logger.error(`Failed to emit read receipt: ${errorMsg}`);
    }
  }
}
