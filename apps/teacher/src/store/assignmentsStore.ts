import { create } from 'zustand';
import { toast } from 'sonner';
import { Assignment } from '@/utils/types/assignment';

interface AssignmentsState {
  // State
  assignmentsByActivity: Record<string, Assignment[]>;
  isLoadingAssignments: Record<string, boolean>;
  isManageStudentsOpen: boolean;
  selectedActivityForStudents: string | null;
  loadedActivities: Set<string>; // Track which activities have been loaded
  
  // Actions
  fetchAssignmentsForActivity: (boardId: string, activityId: string) => Promise<void>;
  fetchAssignmentsForNewActivities: (boardId: string, activityIds: string[]) => Promise<void>; // New method for incremental loading
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
  loadedActivities: new Set<string>(),
  
  // Fetch assignments for a single activity
  fetchAssignmentsForActivity: async (boardId: string, activityId: string) => {
    // Skip if already loading or already loaded
    if (get().isLoadingAssignments[activityId] || get().loadedActivities.has(activityId)) return;
    
    // Set loading state for this activity
    set(state => ({
      isLoadingAssignments: {
        ...state.isLoadingAssignments,
        [activityId]: true
      }
    }));
    
    try {
      // Add a timestamp parameter to avoid caching issues
      const response = await fetch(`/api/assignments/activity/${activityId}?t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }
      
      const assignments = await response.json();
      
      // Update state with fetched assignments and mark as loaded
      set(state => {
        const updatedLoadedActivities = new Set(state.loadedActivities);
        updatedLoadedActivities.add(activityId);
        
        return {
        assignmentsByActivity: {
          ...state.assignmentsByActivity,
          [activityId]: assignments
        },
        isLoadingAssignments: {
          ...state.isLoadingAssignments,
          [activityId]: false
          },
          loadedActivities: updatedLoadedActivities
        };
      });
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
  
  // New method: Fetch assignments only for newly selected activities
  fetchAssignmentsForNewActivities: async (boardId: string, activityIds: string[]) => {
    const { loadedActivities } = get();
    
    // Filter to only get activities that haven't been loaded yet
    const newActivityIds = activityIds.filter(id => !loadedActivities.has(id));
    
    // If no new activities, skip
    if (newActivityIds.length === 0) return;
    
    // Set loading state for the new activities
    set(state => {
      const updatedIsLoadingAssignments = { ...state.isLoadingAssignments };
      newActivityIds.forEach(id => {
        updatedIsLoadingAssignments[id] = true;
      });
      
      return {
        isLoadingAssignments: updatedIsLoadingAssignments
      };
    });
    
    // Show loading toast if loading more than one activity
    const toastId = newActivityIds.length > 0 
      ? toast.loading(`Loading assignments for ${newActivityIds.length} ${newActivityIds.length === 1 ? 'activity' : 'activities'}...`)
      : undefined;
    
    // Fetch assignments for each new activity
    const promises = newActivityIds.map(async (activityId) => {
      try {
        // Add a timestamp parameter to avoid caching issues
        const response = await fetch(`/api/assignments/activity/${activityId}?t=${Date.now()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load assignments for activity ${activityId}`);
        }
        
        const assignments = await response.json();
        
        // Return the result to be processed in bulk
        return { activityId, assignments, success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error(`Failed to load assignments for activity ${activityId}:`, errorMessage);
        return { activityId, assignments: [], success: false };
      }
    });
    
    // Wait for all fetch operations to complete
    const results = await Promise.all(promises);
    
    // Update state with all fetched assignments at once
    set(state => {
      const updatedAssignmentsByActivity = { ...state.assignmentsByActivity };
      const updatedIsLoadingAssignments = { ...state.isLoadingAssignments };
      const updatedLoadedActivities = new Set(state.loadedActivities);
      
      results.forEach(result => {
        const { activityId, assignments, success } = result;
        
        // Update assignments and loading state
        if (success) {
          updatedAssignmentsByActivity[activityId] = assignments;
          updatedLoadedActivities.add(activityId);
        }
        
        updatedIsLoadingAssignments[activityId] = false;
      });
      
      return {
        assignmentsByActivity: updatedAssignmentsByActivity,
        isLoadingAssignments: updatedIsLoadingAssignments,
        loadedActivities: updatedLoadedActivities
      };
    });
    
    // Update the toast with success or failure message
    const successCount = results.filter(r => r.success).length;
    if (toastId) {
      if (successCount === newActivityIds.length) {
        toast.success(`Loaded assignments for ${successCount} ${successCount === 1 ? 'activity' : 'activities'}`, { id: toastId });
      } else if (successCount > 0) {
        toast.success(`Loaded assignments for ${successCount} of ${newActivityIds.length} activities`, { id: toastId });
      } else {
        toast.error(`Failed to load assignments`, { id: toastId });
      }
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
        
        // Ensure this activity is marked as loaded
        const updatedLoadedActivities = new Set(state.loadedActivities);
        updatedLoadedActivities.add(activityId);
        
        return {
          assignmentsByActivity: {
            ...state.assignmentsByActivity,
            [activityId]: updatedAssignments
          },
          loadedActivities: updatedLoadedActivities
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
    // Extract activityId, handling both string and object formats
    const activityId = typeof assignment.activityId === 'object' 
      ? assignment.activityId._id 
      : assignment.activityId;
      
    if (!activityId) {
      console.error('Assignment update missing activityId:', assignment);
      return;
    }
    
    console.log('[AssignmentStore] Updating assignment in store:', {
      assignmentId: assignment._id,
      activityId,
      columnId: assignment.columnId
    });
    
    // Check if we have this activity loaded
    const { assignmentsByActivity, loadedActivities } = get();
    if (!loadedActivities.has(activityId)) {
      console.log(`[AssignmentStore] Activity ${activityId} not loaded yet, adding to store`);
      // Mark this activity as loaded since we're receiving updates for it
      set(state => ({
        loadedActivities: new Set([...state.loadedActivities, activityId])
      }));
    }
    
    set(state => {
      const currentAssignments = [...(state.assignmentsByActivity[activityId] || [])];
      const existingIndex = currentAssignments.findIndex(a => a._id === assignment._id);
      
      if (existingIndex >= 0) {
        console.log(`[AssignmentStore] Updating existing assignment at index ${existingIndex}`);
        currentAssignments[existingIndex] = assignment;
      } else {
        console.log(`[AssignmentStore] Adding new assignment to activity ${activityId}`);
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
      selectedActivityForStudents: null,
      loadedActivities: new Set<string>()
    });
  }
})); 