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
  fetchBoardData: (boardId: string) => Promise<void>;
  updateAssignment: (updatedAssignment: AssignmentWithMeta) => void;
  removeAssignment: (assignmentId: string) => void;
  addAssignment: (newAssignment: AssignmentWithMeta) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  board: null,
  assignments: [],
  isLoadingBoard: true,
  isLoadingAssignments: true,
  error: null,

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
})); 