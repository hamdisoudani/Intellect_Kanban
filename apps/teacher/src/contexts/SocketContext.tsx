import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectToBoard: (boardId: string) => Promise<void>;
  disconnect: () => void;
  assignmentUpdates: any[];
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
  const [assignmentUpdates, setAssignmentUpdates] = useState<any[]>([]);
  const session = useSession()
  
  const connectToBoard = async (boardId: string) => {
    try {
      const socketInstance = await getSocket(session.data?.user.accessToken!);
      setSocket(socketInstance);

      // Remove previous listeners to avoid duplicates
      socketInstance.off('connect');
      socketInstance.off('assignmentUpdated');
      socketInstance.off('connect_error');
      socketInstance.off('disconnect');
      socketInstance.off('joinBoard');

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to server');
        // Only join the board room after connection
        console.log(socketInstance)
        socketInstance.emit('joinBoard', { boardId }, (response: any) => {
            console.log('Server response:', response);
            if (!response.success) {
              console.error('[WebSocket] Error joining board room:', response.error || 'Failed to join room');
            } else {
              console.log(`[WebSocket] Joined room: ${response.room}`);
            }
        });
      });

      socketInstance.on('assignmentUpdated', (data) => {
        console.log('[WebSocket] assignmentUpdated event received:', data);
        
        // Extract relevant information for the notification
        const assignment = data.assignment;
        const studentName = assignment.studentId?.name || 'A student';
        const activityTitle = assignment.activityId?.title || 'an activity';
        const newColumn = assignment.columnId;
        
        // Get the column name from the board data if available
        let columnName = newColumn;
        if (assignment.boardId?.columns && Array.isArray(assignment.boardId.columns)) {
          const column = assignment.boardId.columns.find((col: any) => col.id === newColumn);
          if (column) {
            columnName = column.name;
          }
        }
        
        // Show toast notification
        toast.info(`Assignment Updated`, {
          description: `${studentName} moved "${activityTitle}" to "${columnName}"`,
          duration: 5000,
          position: 'top-right',
        });
        
        // Add to recent updates
        setAssignmentUpdates(prev => [data, ...prev].slice(0, 10)); // Keep last 10 updates
      });

      socketInstance.on('connect_error', (err) => {
        setIsConnected(false);
        console.error('[WebSocket] Connection error:', err);
      });

      socketInstance.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected from server. Reason:', reason);
      });

      // Debug: log all events
      socketInstance.onAny((event, ...args) => {
        console.log(`[WebSocket] Event received: ${event}`, ...args);
      });

      // Connect to the server
      socketInstance.connect();
    } catch (error) {
      console.error('[WebSocket] Failed to initialize connection:', error);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.off('connect');
      socket.off('assignmentUpdated');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('joinBoard');
      socket.offAny();
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      console.log('[WebSocket] Socket disconnected and cleanup complete');
    }
  };

  useEffect(() => {
    if (boardId && session.status === "authenticated") {
      connectToBoard(boardId);
    }
    return () => {
      disconnect();
    };
  }, [boardId, session]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectToBoard, disconnect, assignmentUpdates }}>
      {children}
    </SocketContext.Provider>
  );
}; 