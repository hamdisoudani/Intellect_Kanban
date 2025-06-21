import { create } from 'zustand';
import { toast } from 'sonner';
import { Board, AssignmentWithMeta } from '@/types';
import { fetchBoard, fetchBoardAssignments } from '@/utils/api';

interface BoardState {
  board: Board | null;
  assignments: AssignmentWithMeta[];
  isLoadingBoard: boolean;
  isLoadingAssignments: boolean;
  error: string | null;
  recentlyUpdatedAssignments: Record<string, boolean>; // Track recently updated assignments
  fetchBoardData: (boardId: string) => Promise<void>;
  updateAssignment: (updatedAssignment: AssignmentWithMeta) => void;
  removeAssignment: (assignmentId: string) => void;
  addAssignment: (newAssignment: AssignmentWithMeta) => void;
  /**
   * Updates assignments when a meta activity is updated
   * This is called when receiving a WebSocket event for meta activity updates
   */
  updateAssignmentsFromMetaActivity: (activityId: string, metaActivityData: any) => void;
  clearRecentlyUpdated: (assignmentId: string) => void; // Clear the updated status
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  assignments: [],
  isLoadingBoard: true,
  isLoadingAssignments: true,
  error: null,
  recentlyUpdatedAssignments: {}, // Initialize empty object

  fetchBoardData: async (boardId: string) => {
    try {
      set({ isLoadingBoard: true, isLoadingAssignments: true, error: null });
      const [boardResult, assignmentsResult] = await Promise.all([
        fetchBoard(boardId),
        fetchBoardAssignments(boardId)
      ]);

      const transformedAssignments = assignmentsResult.map((assignment: any) => ({
        _id: assignment._id,
        activityId: assignment.activityId._id,
        studentId: assignment.studentId._id,
        boardId: assignment.boardId,
        columnId: assignment.columnId,
        position: assignment.position,
        notes: assignment.notes,
        title: assignment.activityId.title,
        description: assignment.activityId.description,
        dueDate: assignment.activityId.dueDate,
        difficultyLevel: assignment.activityId.difficultyLevel,
        estimatedTimeMinutes: assignment.activityId.estimatedTimeMinutes,
        tags: assignment.activityId.tags?.map((tag: any) => ({
          id: tag._id,
          label: tag.name,
          color: tag.color
        })) || [],
        priority: assignment.activityId.priority,
        attachments: assignment.activityId.attachments || [],
        feedback: assignment.feedback || [],
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      }));

      set({
        board: boardResult,
        assignments: transformedAssignments,
        isLoadingBoard: false,
        isLoadingAssignments: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch board data';
      set({ error: errorMessage, isLoadingBoard: false, isLoadingAssignments: false });
      toast.error('Error fetching board', { description: errorMessage });
    }
  },

  updateAssignment: (updatedAssignment: AssignmentWithMeta) => {
    set(state => ({
      assignments: state.assignments.map(assignment =>
        assignment._id === updatedAssignment._id
          ? { ...assignment, ...updatedAssignment }
          : assignment
      ),
    }));
  },

  removeAssignment: (assignmentId: string) => {
    set(state => ({
      assignments: state.assignments.filter(a => a._id !== assignmentId),
    }));
  },

  addAssignment: (newAssignment: AssignmentWithMeta) => {
    set(state => ({
      assignments: [...state.assignments, newAssignment],
    }));
  },

  /**
   * Updates assignments when a meta activity is updated
   * This is called when receiving a WebSocket event for meta activity updates
   */
  updateAssignmentsFromMetaActivity: (activityId: string, metaActivityData: any) => {
    set(state => {
      // Find all assignments linked to this meta activity
      const updatedAssignments = state.assignments.map(assignment => {
        // Only update assignments linked to this meta activity
        if (assignment.activityId === activityId) {
          return {
            ...assignment,
            // Update meta activity data in the assignment
            title: metaActivityData.title,
            description: metaActivityData.description,
            dueDate: metaActivityData.dueDate,
            difficultyLevel: metaActivityData.difficultyLevel,
            estimatedTimeMinutes: metaActivityData.estimatedTimeMinutes,
            tags: metaActivityData.tags?.map((tag: any) => ({
              id: tag._id,
              label: tag.name,
              color: tag.color
            })) || [],
          };
        }
        return assignment;
      });

      // Mark all assignments from this activity as recently updated
      const updatedIds = updatedAssignments
        .filter(assignment => assignment.activityId === activityId)
        .reduce((acc, assignment) => {
          acc[assignment._id] = true;
          return acc;
        }, {} as Record<string, boolean>);

      // Set a timeout to clear the updated status after animation completes
      Object.keys(updatedIds).forEach(id => {
        setTimeout(() => {
          get().clearRecentlyUpdated(id);
        }, 3000); // Animation will run for 3 seconds
      });

      return { 
        assignments: updatedAssignments,
        recentlyUpdatedAssignments: {
          ...state.recentlyUpdatedAssignments,
          ...updatedIds
        }
      };
    });
  },

  clearRecentlyUpdated: (assignmentId: string) => {
    set(state => ({
      recentlyUpdatedAssignments: {
        ...state.recentlyUpdatedAssignments,
        [assignmentId]: false
      }
    }));
  }
})); 