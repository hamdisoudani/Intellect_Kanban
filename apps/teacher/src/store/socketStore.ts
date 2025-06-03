import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { toast } from 'sonner';
import { Assignment } from '@/utils/types/assignment';
import { useAssignmentsStore } from './assignmentsStore';

interface SocketState {
  // State
  socket: Socket | null;
  isConnected: boolean;
  assignmentUpdates: Assignment[];
  
  // Actions
  connectToBoard: (boardId: string, token: string) => Promise<void>;
  disconnect: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  assignmentUpdates: [],
  
  // Actions
  connectToBoard: async (boardId: string, token: string) => {
    try {
      // Disconnect any existing socket first
      if (get().socket) {
        get().disconnect();
      }
      
      // Get a new socket instance
      const socketInstance = await getSocket(token);
      
      // Set the socket instance in state
      set({ socket: socketInstance });
      
      // Remove previous listeners to avoid duplicates
      socketInstance.off('connect');
      socketInstance.off('assignmentUpdated');
      socketInstance.off('connect_error');
      socketInstance.off('disconnect');
      socketInstance.off('joinBoard');
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        set({ isConnected: true });
        console.log('[WebSocket] Connected to server');
        
        // Join the board room after connection
        socketInstance.emit('joinBoard', { boardId }, (response: any) => {
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
        set(state => ({ 
          assignmentUpdates: [data.assignment, ...state.assignmentUpdates].slice(0, 10) // Keep last 10 updates
        }));
        
        // Update the assignment in the assignments store
        useAssignmentsStore.getState().handleAssignmentUpdate(data.assignment);
      });
      
      socketInstance.on('connect_error', (err) => {
        set({ isConnected: false });
        console.error('[WebSocket] Connection error:', err);
      });
      
      socketInstance.on('disconnect', (reason) => {
        set({ isConnected: false });
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
  },
  
  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      // Remove all event listeners
      socket.off('connect');
      socket.off('assignmentUpdated');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('joinBoard');
      socket.offAny();
      
      // Disconnect the socket
      disconnectSocket();
      
      // Update state
      set({ 
        socket: null,
        isConnected: false
      });
      
      console.log('[WebSocket] Socket disconnected and cleanup complete');
    }
  },
  
  reset: () => {
    const { socket } = get();
    
    if (socket) {
      // Disconnect the socket before resetting
      get().disconnect();
    }
    
    set({
      socket: null,
      isConnected: false,
      assignmentUpdates: []
    });
  }
})); 