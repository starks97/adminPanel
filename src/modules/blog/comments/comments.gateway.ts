import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class CommentsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('newComment')
  handleNewComment(client: any, payload: any) {
    // Emit the new comment event to clients viewing the same post
    this.server.to(`post_${payload.postId}`).emit('newComment', payload.comment);
  }
}
