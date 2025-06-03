import { create } from 'zustand';
import { useActivitiesStore } from './activitiesStore';

interface DragDropState {
  // State
  draggingActivity: string | null;
  draggingFromColumn: string | null;
  
  // Actions
  startDrag: (activityId: string, columnId: string) => void;
  endDrag: () => void;
  handleDrop: (boardId: string, targetColumnId: string) => Promise<void>;
  reset: () => void;
}

export const useDragDropStore = create<DragDropState>((set, get) => ({
  // Initial state
  draggingActivity: null,
  draggingFromColumn: null,
  
  // Actions
  startDrag: (activityId: string, columnId: string) => {
    // Don't allow dragging from meta-activities column
    if (columnId === 'meta-activities') return;
    set({ 
      draggingActivity: activityId,
      draggingFromColumn: columnId 
    });
  },
  
  endDrag: () => {
    set({ 
      draggingActivity: null,
      draggingFromColumn: null 
    });
  },
  
  handleDrop: async (boardId: string, targetColumnId: string) => {
    const { draggingActivity, draggingFromColumn } = get();
    
    // Don't allow dropping on meta-activities column
    if (targetColumnId === 'meta-activities') return;
    
    // Don't proceed if no activity is being dragged or if dropping in the same column
    if (!draggingActivity || !draggingFromColumn || draggingFromColumn === targetColumnId) {
      return;
    }
    
    try {
      // Use the activities store to handle the actual move
      await useActivitiesStore.getState().moveActivity(
        boardId,
        draggingActivity,
        targetColumnId
      );
    } finally {
      // Clear the dragging state regardless of success or failure
      set({ 
        draggingActivity: null,
        draggingFromColumn: null 
      });
    }
  },
  
  reset: () => {
    set({
      draggingActivity: null,
      draggingFromColumn: null
    });
  }
})); 