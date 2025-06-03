import { create } from 'zustand';
import { toast } from 'sonner';
import { Assignment } from '@/utils/types/assignment';

interface AssignmentsState {
  // State
  assignmentsByActivity: Record<string, Assignment[]>;
  isLoadingAssignments: Record<string, boolean>;
  isManageStudentsOpen: boolean;
  selectedActivityForStudents: string | null;
  
  // Actions
  fetchAssignmentsForActivity: (boardId: string, activityId: string) => Promise<void>;
  updateAssignment: (boardId: string, assignmentId: string, updates: Partial<Assignment>) => Promise<void>;
  addAssignments: (boardId: string, activityId: string, studentIds: string[]) => Promise<void>;
  removeAssignments: (boardId: string, activityId: string, studentIds: string[]) => Promise<void>;
  
  // UI Actions
  openManageStudents: (activityId: string) => void;
  closeManageStudents: () => void;
  
  // Socket update handler
  handleAssignmentUpdate: (assignment: Assignment) => void;
  
  // Reset
  reset: () => void;
}

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  // Initial state
  assignmentsByActivity: {},
  isLoadingAssignments: {},
  isManageStudentsOpen: false,
  selectedActivityForStudents: null,
  
  // Actions
  fetchAssignmentsForActivity: async (boardId: string, activityId: string) => {
    // Skip if already loading
    if (get().isLoadingAssignments[activityId]) return;
    
    // Set loading state for this activity
    set(state => ({
      isLoadingAssignments: {
        ...state.isLoadingAssignments,
        [activityId]: true
      }
    }));
    
    try {
      const response = await fetch(`/api/assignments/activity/${activityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }
      
      const assignments = await response.json();
      
      // Update state with fetched assignments
      set(state => ({
        assignmentsByActivity: {
          ...state.assignmentsByActivity,
          [activityId]: assignments
        },
        isLoadingAssignments: {
          ...state.isLoadingAssignments,
          [activityId]: false
        }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to load assignments', { 
        description: errorMessage
      });
      
      // Clear loading state on error
      set(state => ({
        isLoadingAssignments: {
          ...state.isLoadingAssignments,
          [activityId]: false
        }
      }));
    }
  },
  
  updateAssignment: async (boardId: string, assignmentId: string, updates: Partial<Assignment>) => {
    try {
      const response = await fetch(`/api/board/${boardId}/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }
      
      const updatedAssignment = await response.json();
      
      // Find which activity this assignment belongs to
      const activityId = typeof updatedAssignment.activityId === 'object' 
        ? updatedAssignment.activityId._id 
        : updatedAssignment.activityId;
        
      if (!activityId) {
        console.error('Updated assignment has no activityId');
        return;
      }
      
      // Update the assignment in state
      set(state => {
        const currentAssignments = [...(state.assignmentsByActivity[activityId] || [])];
        const existingIndex = currentAssignments.findIndex(a => a._id === updatedAssignment._id);
        
        if (existingIndex >= 0) {
          currentAssignments[existingIndex] = updatedAssignment;
        } else {
          currentAssignments.push(updatedAssignment);
        }
        
        return {
          assignmentsByActivity: {
            ...state.assignmentsByActivity,
            [activityId]: currentAssignments
          }
        };
      });
      
      toast.success('Assignment updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to update assignment', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  addAssignments: async (boardId: string, activityId: string, studentIds: string[]) => {
    if (!studentIds.length) return;
    
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign students');
      }
      
      const newAssignments = await response.json() as Assignment[];
      
      // Update state with new assignments
      set(state => {
        const currentAssignments = [...(state.assignmentsByActivity[activityId] || [])];
        const updatedAssignments = [...currentAssignments];
        
        // Add new assignments, avoiding duplicates
        newAssignments.forEach((newAssignment: Assignment) => {
          const exists = currentAssignments.some(a => a._id === newAssignment._id);
          if (!exists) {
            updatedAssignments.push(newAssignment);
          }
        });
        
        return {
          assignmentsByActivity: {
            ...state.assignmentsByActivity,
            [activityId]: updatedAssignments
          }
        };
      });
      
      toast.success(`${newAssignments.length} students assigned successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to assign students', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  removeAssignments: async (boardId: string, activityId: string, studentIds: string[]) => {
    if (!studentIds.length) return;
    
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to unassign students');
      }
      
      // Update state by removing the unassigned students
      set(state => {
        const currentAssignments = [...(state.assignmentsByActivity[activityId] || [])];
        const updatedAssignments = currentAssignments.filter(assignment => {
          const studentId = typeof assignment.studentId === 'object'
            ? assignment.studentId._id
            : assignment.studentId;
            
          return !studentIds.includes(studentId);
        });
        
        return {
          assignmentsByActivity: {
            ...state.assignmentsByActivity,
            [activityId]: updatedAssignments
          }
        };
      });
      
      toast.success(`${studentIds.length} students unassigned successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to unassign students', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  // UI Actions
  openManageStudents: (activityId: string) => {
    set({ 
      isManageStudentsOpen: true,
      selectedActivityForStudents: activityId
    });
  },
  
  closeManageStudents: () => {
    set({ 
      isManageStudentsOpen: false,
      selectedActivityForStudents: null
    });
  },
  
  // Socket update handler
  handleAssignmentUpdate: (assignment: Assignment) => {
    const activityId = typeof assignment.activityId === 'object' 
      ? assignment.activityId._id 
      : assignment.activityId;
      
    if (!activityId) return;
    
    set(state => {
      const currentAssignments = [...(state.assignmentsByActivity[activityId] || [])];
      const existingIndex = currentAssignments.findIndex(a => a._id === assignment._id);
      
      if (existingIndex >= 0) {
        currentAssignments[existingIndex] = assignment;
      } else {
        currentAssignments.push(assignment);
      }
      
      return {
        assignmentsByActivity: {
          ...state.assignmentsByActivity,
          [activityId]: currentAssignments
        }
      };
    });
  },
  
  // Reset
  reset: () => {
    set({
      assignmentsByActivity: {},
      isLoadingAssignments: {},
      isManageStudentsOpen: false,
      selectedActivityForStudents: null
    });
  }
})); 