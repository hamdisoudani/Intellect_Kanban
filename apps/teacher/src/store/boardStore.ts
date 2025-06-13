import { create } from 'zustand';
import { toast } from 'sonner';
import { Board } from '@/utils/types';
import { StudentOption } from '@/utils/types';

interface BoardState {
  // State
  board: Board | null;
  isLoading: boolean;
  error: string | null;
  students: StudentOption[];
  currentView: 'personal' | 'class';
  
  // Actions
  fetchBoard: (boardId: string) => Promise<void>;
  updateBoardTitle: (boardId: string, title: string) => Promise<void>;
  setCurrentView: (view: 'personal' | 'class') => void;
  reset: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  // Initial state
  board: null,
  isLoading: false,
  error: null,
  students: [],
  currentView: 'personal',
  
  // Actions
  fetchBoard: async (boardId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/board/${boardId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load board data');
      }
      
      const boardData = await response.json();
      
      // Normalize student data structure - ensure each student has _id property
      const normalizedStudents = boardData.students?.map((student: any) => ({
        _id: student._id || student.id, // Use _id if exists, otherwise use id
        name: student.name,
        email: student.email
      })) || [];
      
      console.log('[boardStore] Normalized students:', normalizedStudents);
      
      set({ 
        board: boardData,
        students: normalizedStudents,
        isLoading: false 
      });
      
      return boardData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      toast.error('Failed to load board', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  updateBoardTitle: async (boardId: string, title: string) => {
    // Don't update if title is empty
    if (!title.trim()) return;
    
    // Don't update if title didn't change
    if (get().board?.name === title) return;
    
    // Optimistically update the title
    const previousTitle = get().board?.name;
    const currentBoard = get().board;
    
    if (currentBoard) {
      set({ 
        board: { 
          ...currentBoard, 
          name: title 
        } 
      });
    }
    
    try {
      // TODO: Implement API call to update board title
      // For now, we'll simulate a successful update
      toast.success('Board title updated');
    } catch (error) {
      // Revert on error
      if (currentBoard && previousTitle) {
        set({ 
          board: { 
            ...currentBoard, 
            name: previousTitle 
          } 
        });
      }
      toast.error('Failed to update board title');
    }
  },
  
  setCurrentView: (view: 'personal' | 'class') => {
    set({ currentView: view });
  },
  
  reset: () => {
    set({
      board: null,
      isLoading: false,
      error: null,
      students: [],
      currentView: 'personal'
    });
  }
})); 