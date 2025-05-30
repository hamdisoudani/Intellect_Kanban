import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/utils/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectToBoard: (boardId: string) => Promise<void>;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
  boardId?: string;
}

export const SocketProvider = ({ children, boardId }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connectToBoard = async (boardId: string) => {
    try {
      const socketInstance = await getSocket();
      setSocket(socketInstance);

      // Remove previous listeners
      socketInstance.off('connect');
      socketInstance.off('connect_error');
      socketInstance.off('disconnect');

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('[Student WebSocket] Connected to server');
        socketInstance.emit('joinBoard', { boardId }, (response: any) => {
          if (response.error || !response.success) {
            console.error('[Student WebSocket] Error joining board room:', response.error || 'Failed to join room');
          } else {
            console.log(`[Student WebSocket] Joined room: ${response.room}`);
          }
        });
      });

      socketInstance.on('connect_error', (err) => {
        setIsConnected(false);
        console.error('[Student WebSocket] Connection error:', err);
      });

      socketInstance.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('[Student WebSocket] Disconnected from server. Reason:', reason);
      });
      
      socketInstance.onAny((event, ...args) => {
        console.log(`[Student WebSocket] Event received: ${event}`, ...args);
      });

      socketInstance.connect();
    } catch (error) {
      console.error('[Student WebSocket] Failed to initialize connection:', error);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.offAny();
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      console.log('[Student WebSocket] Socket disconnected and cleanup complete');
    }
  };

  useEffect(() => {
    if (boardId) {
      connectToBoard(boardId);
    }
    return () => {
      disconnect();
    };
  }, [boardId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectToBoard, disconnect }}>
      {children}
    </SocketContext.Provider>
  );
}; 