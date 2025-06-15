import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { WebsocketMiddlewareProvider } from './websocket.middleware';
import { UserRole } from '../users/schemas/user.schema';

@WebSocketGateway({
  cors: true,
  namespace: 'boards'
})
@Injectable()
export class BoardGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(BoardGateway.name);
  
  @WebSocketServer()
  server!: Server;

  constructor(private websocketMiddleware: WebsocketMiddlewareProvider) {}

  /**
   * Initialize the WebSocket gateway
   */
  afterInit(server: Server) {
    this.logger.log('Board WebSocket Gateway initialized');
    server.use(this.websocketMiddleware.getMiddleware());
  }

  /**
   * Handle new WebSocket connections
   */
  handleConnection(@ConnectedSocket() client: Socket) {
    const user = client.data.user;
    if (!user) {
      this.logger.error(`[BoardGateway] Client connection rejected - no authenticated user: ${client.id}`);
      client.disconnect(true); // Force disconnect
      return;
    }

    this.logger.log(
      `[BoardGateway] Client connected: ${client.id} (User: ${user.email}, Role: ${user.role})`
    );
  }

  /**
   * Handle WebSocket disconnections
   */
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`[BoardGateway] Client disconnected: ${client.id}`);
  }

  /**
   * Join a room based on user role
   * Teachers join "board:{boardId}:teachers"
   * Students join "board:{boardId}:student:{studentId}"
   */
  @SubscribeMessage('joinBoard')
  handleJoinRoom(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: { boardId: string },
  ): { success: boolean; room?: string; error?: string } {
    const { boardId } = payload;
    const user = client.data.user;
    
    this.logger.log(`[BoardGateway] User ${user?.email} attempting to join board room for board: ${boardId}`);

    if (!user || !boardId) {
      this.logger.error('[BoardGateway] Invalid joinBoard request: missing user or boardId');
      return { success: false, error: 'Invalid request: missing user or boardId' };
    }

    // Leave all previous rooms except the default client.id room
    client.rooms.forEach(room => {
      if (room !== client.id) {
        this.logger.log(`[BoardGateway] Client ${client.id} leaving room: ${room}`);
        client.leave(room);
      }
    });

    let roomToJoin = '';
    if (user.role === UserRole.TEACHER) {
      roomToJoin = `board:${boardId}:teachers`;
    } else if (user.role === UserRole.STUDENT) {
      roomToJoin = `board:${boardId}:student:${user.id}`;
      this.logger.log(`[BoardGateway] Student ${user.email} will join specific room: ${roomToJoin}`);
    } else {
      this.logger.warn(`[BoardGateway] User ${user.email} has an unauthorized role: ${user.role}`);
      return { success: false, error: 'Unauthorized role' };
    }

    client.join(roomToJoin);
    this.logger.log(
      `[BoardGateway] User ${user.email} (Role: ${user.role}, Client ID: ${client.id}) successfully joined room: ${roomToJoin}`
    );
    // Explicitly acknowledge success
    return { success: true, room: roomToJoin };
  }
  
  /**
   * Notify teachers about assignment updates
   * This method will be called from AssignmentsService
   */
  notifyTeachersAboutAssignmentUpdate(boardId: string, assignmentData: any) {
    const room = `board:${boardId}:teachers`;
    this.logger.log(`[BoardGateway] Notifying teachers in room ${room} about assignment update. Data: ${JSON.stringify(assignmentData)}`);
    
    this.server.to(room).emit('assignmentUpdated', {
      boardId,
      assignment: assignmentData
    });
  }
  
  /**
   * Notify a student about a new assignment
   * This method will be called from AssignmentsService
   */
  notifyStudentAboutNewAssignment(boardId: string, studentId: string | any, assignmentData: any) {
    // Extract student ID as string from object if needed
    const studentIdStr = typeof studentId === 'object' && studentId !== null 
      ? (studentId._id ? studentId._id.toString() : studentId.toString())
      : studentId;
      
    const room = `board:${boardId}:student:${studentIdStr}`;
    this.logger.log(`[BoardGateway] Notifying student ${studentIdStr} in room ${room} about new assignment`);
    
    this.server.to(room).emit('assignmentCreated', {
      boardId,
      assignment: assignmentData
    });
  }
} 