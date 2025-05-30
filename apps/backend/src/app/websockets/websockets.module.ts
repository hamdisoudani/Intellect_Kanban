import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BoardGateway } from './board.gateway';
import { WebsocketMiddlewareProvider } from './websocket.middleware';

@Module({
  imports: [
    // Import the JWT module with the same configuration as the auth module
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'intellect-kanban-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [BoardGateway, WebsocketMiddlewareProvider],
  exports: [BoardGateway],
})
export class WebsocketsModule {} 