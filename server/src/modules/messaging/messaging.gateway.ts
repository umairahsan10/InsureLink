import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagingGateway {
  private readonly logger = new Logger(MessagingGateway.name);

  @WebSocketServer()
  server: Server;

  /**
   * Client joins a claim chat room
   */
  @SubscribeMessage('join-claim-room')
  handleJoinRoom(
    @MessageBody() data: { claimId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `claim-${data.claimId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Client leaves a claim chat room
   */
  @SubscribeMessage('leave-claim-room')
  handleLeaveRoom(
    @MessageBody() data: { claimId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `claim-${data.claimId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'left', room };
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
  emitNewMessage(claimId: string, message: any) {
    const room = `claim-${claimId}`;
    this.server.to(room).emit('claim-message-new', message);
  }

  /**
   * Emit read receipt to claim room (called from service layer)
   */
  emitMessageRead(claimId: string, readBy: string, markedCount: number) {
    const room = `claim-${claimId}`;
    this.server.to(room).emit('claim-message-read', {
      claimId,
      readBy,
      readAt: new Date().toISOString(),
      markedCount,
    });
  }
}
