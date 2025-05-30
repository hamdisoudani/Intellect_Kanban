import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class WebsocketMiddlewareProvider {
  constructor(private readonly jwtService: JwtService) {}

  getMiddleware() {
    return (socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = this.extractToken(socket);
        
        if (!token) {
          return next(new Error('Authentication error: Token not provided'));
        }

        // Verify the token using the same JWT service as the auth module
        const payload = this.jwtService.verify(token);
        
        if (!payload) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Attach user data to the socket for later use
        socket.data.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role
        };
        
        // Log successful connection
        console.log(`WebSocket client connected: ${socket.id} (User: ${payload.email}, Role: ${payload.role})`);
        
        return next();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('WebSocket authentication error:', errorMessage);
        return next(new Error('Authentication error: ' + errorMessage));
      }
    };
  }

  private extractToken(socket: Socket): string | null {
    // Try to extract token from Authorization header
    const authHeader = socket.handshake.auth.token;
    console.log(authHeader)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Fallback to query parameter
    const query = socket.handshake.query;
    if (query && query.token && typeof query.token === 'string') {
      return query.token;
    }
    
    return null;
  }
} 