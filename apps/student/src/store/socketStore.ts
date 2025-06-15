import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/utils/socket';
import { toast } from 'sonner';
import { AssignmentWithMeta } from '@/types';
import { useBoardStore } from './boardStore';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectToBoard: (boardId: string, token: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

    connectToBoard: (boardId: string, token: string) => {
    // Check if we already have a connected socket
    const currentSocket = get().socket;
    if (currentSocket?.connected) {
      console.log('[WebSocket] Already connected, reusing socket');
      
      // Re-join the board room with the current socket
      currentSocket.emit('joinBoard', { boardId }, (response: any) => {
        if (response.success) {
          console.log(`[WebSocket] Successfully joined room: ${response.room}`);
        } else {
          console.error(`[WebSocket] Failed to join room: ${response.error}`);
          toast.error('Could not connect to board', { description: response.error });
        }
      });
      
      return;
    }
    
    // Get or create a socket instance
    const socketInstance = getSocket(token);
    set({ socket: socketInstance });
      
    // Remove previous listeners to avoid duplicates
    socketInstance.off('connect');
    socketInstance.off('disconnect');
    socketInstance.off('connect_error');
    socketInstance.off('assignmentDeleted');
    socketInstance.off('assignmentUpdated');

    // Set up event listeners
    socketInstance.on('connect', () => {
      set({ isConnected: true });
      console.log('[WebSocket] Connected to server');
      
      socketInstance.emit('joinBoard', { boardId }, (response: any) => {
        if (response.success) {
          console.log(`[WebSocket] Successfully joined room: ${response.room}`);
        } else {
          console.error(`[WebSocket] Failed to join room: ${response.error}`);
          toast.error('Could not connect to board', { description: response.error });
        }
      });
    });
      
    socketInstance.on('disconnect', (reason) => {
      set({ isConnected: false });
      console.log(`[WebSocket] Disconnected: ${reason}`);
      
      // Only show the toast if it's not a client-initiated disconnect
      if (reason !== 'io client disconnect') {
        toast.error('Real-time connection lost');
      }
    });

    socketInstance.on('connect_error', (err) => {
      set({ isConnected: false });
      console.error(`[WebSocket] Connection error: ${err.message}`);
      toast.error('Connection Error', { description: 'Could not connect to real-time server.' });
    });
    
    socketInstance.on('assignmentDeleted', (data: { assignmentId: string }) => {
      console.log('[WebSocket] assignmentDeleted event received:', data);
      useBoardStore.getState().removeAssignment(data.assignmentId);
      toast.info('An assignment has been removed by the teacher.');
    });

    socketInstance.on('assignmentCreated', (data: { assignment: any }) => {
      console.log('[WebSocket] assignmentCreated event received:', data);
      
      try {
        // Extract activity ID and student ID safely
        const activityId = typeof data.assignment.activityId === 'object' && data.assignment.activityId !== null
          ? data.assignment.activityId._id
          : data.assignment.activityId;
          
        const studentId = typeof data.assignment.studentId === 'object' && data.assignment.studentId !== null
          ? data.assignment.studentId._id
          : data.assignment.studentId;
        
        // Transform the assignment to match the format expected by the UI
        const transformedAssignment: AssignmentWithMeta = {
          _id: data.assignment._id,
          activityId: activityId,
          studentId: studentId,
          boardId: data.assignment.boardId,
          columnId: data.assignment.columnId,
          position: data.assignment.position,
          notes: data.assignment.notes,
          title: data.assignment.activityId.title,
          description: data.assignment.activityId.description,
          dueDate: data.assignment.activityId.dueDate,
          difficultyLevel: data.assignment.activityId.difficultyLevel,
          estimatedTimeMinutes: data.assignment.activityId.estimatedTimeMinutes,
          tags: Array.isArray(data.assignment.activityId.tags) 
            ? data.assignment.activityId.tags.map((tag: any) => ({
                id: tag._id,
                label: tag.name,
                color: tag.color
              })) 
            : [],
          createdAt: data.assignment.createdAt,
          updatedAt: data.assignment.updatedAt
        };
        
        useBoardStore.getState().addAssignment(transformedAssignment);
        toast.info('New assignment received', {
          description: `You've been assigned: ${transformedAssignment.title}`
        });
      } catch (error) {
        console.error('[WebSocket] Error processing assignment created event:', error);
        toast.error('Error processing new assignment');
      }
    });

    socketInstance.on('assignmentUpdated', (data: { assignment: AssignmentWithMeta }) => {
      console.log('[WebSocket] assignmentUpdated event received:', data);
      useBoardStore.getState().updateAssignment(data.assignment);
    });

    // For debugging
    socketInstance.onAny((event, ...args) => {
      console.log(`[WebSocket] Event received: ${event}`, ...args);
    });
      
    // Manually connect
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.offAny();
      disconnectSocket(); // No need to pass socket with the singleton pattern
      set({ socket: null, isConnected: false });
      console.log('[WebSocket] Socket disconnected and cleanup complete');
    }
  },

  reset: () => {
    get().disconnect();
  },
})); 