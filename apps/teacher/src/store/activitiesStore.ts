import { create } from 'zustand';
import { toast } from 'sonner';
import { Activity } from '@/utils/types';
import { DifficultyLevel } from '@/types/activities';

// Extended activity type that includes tags and difficulty level
type ExtendedActivity = Activity & {
  tags?: any[];
  difficultyLevel?: DifficultyLevel;
};

interface ActivitiesState {
  // State
  activities: Record<string, ExtendedActivity[]>;
  metaActivities: ExtendedActivity[];
  isLoading: boolean;
  selectedActivity: ExtendedActivity | null;
  isActivityDetailOpen: boolean;
  isCreateActivityOpen: boolean;
  preSelectedColumn: string | null;
  deletingActivityId: string;
  isMetaActivityDetailOpen: boolean;
  detailMetaActivity: ExtendedActivity | null;
  
  // Meta activity selection
  selectedMetaActivities: Set<string>;
  metaActivitySearchQuery: string;
  
  // Actions
  fetchActivities: (boardId: string) => Promise<void>;
  createActivity: (boardId: string, activity: Partial<ExtendedActivity>) => Promise<ExtendedActivity>;
  updateActivity: (boardId: string, activityId: string, updates: Partial<ExtendedActivity>) => Promise<ExtendedActivity>;
  deleteActivity: (boardId: string, activityId: string) => Promise<void>;
  moveActivity: (boardId: string, activityId: string, targetColumnId: string) => Promise<void>;
  
  // UI Actions
  selectActivity: (activity: ExtendedActivity | null) => void;
  openActivityDetail: (activity: ExtendedActivity) => void;
  closeActivityDetail: () => void;
  openCreateActivity: (columnId: string | null) => void;
  closeCreateActivity: () => void;
  setDeletingActivityId: (activityId: string) => void;
  openMetaActivityDetail: (activity: ExtendedActivity) => void;
  closeMetaActivityDetail: () => void;
  
  // Meta activity selection actions
  toggleMetaActivitySelection: (activityId: string) => Promise<void>;
  selectAllMetaActivities: () => Promise<void>;
  clearMetaActivitySelection: () => void;
  setMetaActivitySearchQuery: (query: string) => void;
  
  // Reset
  reset: () => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  // Initial state
  activities: {},
  metaActivities: [],
  isLoading: false,
  selectedActivity: null,
  isActivityDetailOpen: false,
  isCreateActivityOpen: false,
  preSelectedColumn: null,
  deletingActivityId: '',
  isMetaActivityDetailOpen: false,
  detailMetaActivity: null,
  
  // Meta activity selection
  selectedMetaActivities: new Set<string>(),
  metaActivitySearchQuery: '',
  
  // Actions
  fetchActivities: async (boardId: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`/api/board/${boardId}/activities`);
      
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      
      const activitiesData = await response.json();
      
      if (!Array.isArray(activitiesData)) {
        toast.error('Invalid activities data format');
        return;
      }

      // Group activities by column
      const groupedActivities: Record<string, ExtendedActivity[]> = {};
      const metaActivitiesList: ExtendedActivity[] = [];
      
      // Initialize columns with empty arrays
      // We'll need to get the columns from the board store later
      // For now, we'll rely on the activities data
      activitiesData.forEach((activity: ExtendedActivity) => {
        if (!activity._id) return;
        
        const columnId = activity.columnId;
        if (columnId) {
          if (!groupedActivities[columnId]) {
            groupedActivities[columnId] = [];
          }
          groupedActivities[columnId].push(activity);
        }
        
        if (activity.type === 'meta') {
          metaActivitiesList.push(activity);
        }
      });
      
      set({ 
        activities: groupedActivities,
        metaActivities: metaActivitiesList,
        isLoading: false 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to load activities', { 
        description: errorMessage
      });
      set({ isLoading: false });
    }
  },
  
  createActivity: async (boardId: string, activity: Partial<ExtendedActivity>) => {
    try {
      const response = await fetch(`/api/board/${boardId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create activity');
      }
      
      const newActivity: ExtendedActivity = await response.json();
      
      // Update local state
      set(state => {
        const updatedActivities = { ...state.activities };
        const columnId = newActivity.columnId;
        
        if (columnId) {
          if (!updatedActivities[columnId]) {
            updatedActivities[columnId] = [];
          }
          updatedActivities[columnId] = [...updatedActivities[columnId], newActivity];
        }
        
        // If it's a meta activity, add it to the meta activities list
        const updatedMetaActivities = [...state.metaActivities];
        if (newActivity.type === 'meta') {
          updatedMetaActivities.push(newActivity);
        }
        
        return {
          activities: updatedActivities,
          metaActivities: updatedMetaActivities,
          isCreateActivityOpen: false // Close the create dialog
        };
      });
      
      toast.success('Activity created successfully');
      return newActivity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to create activity', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  updateActivity: async (boardId: string, activityId: string, updates: Partial<ExtendedActivity>) => {
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity');
      }
      
      const updatedActivity: ExtendedActivity = await response.json();
      
      // Update local state
      set(state => {
        const updatedActivities = { ...state.activities };
        const columnId = updatedActivity.columnId;
        
        // Update in column activities
        if (columnId && updatedActivities[columnId]) {
          updatedActivities[columnId] = updatedActivities[columnId].map(act => 
            act._id === activityId ? updatedActivity : act
          );
        }
        
        // Update in meta activities if needed
        const updatedMetaActivities = state.metaActivities.map(act => 
          act._id === activityId ? updatedActivity : act
        );
        
        return {
          activities: updatedActivities,
          metaActivities: updatedActivity.type === 'meta' ? updatedMetaActivities : state.metaActivities
        };
      });
      
      toast.success('Activity updated successfully');
      return updatedActivity;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to update activity', { 
        description: errorMessage
      });
      throw err;
    }
  },
  
  deleteActivity: async (boardId: string, activityId: string) => {
    set({ deletingActivityId: activityId });
    
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }
      
      // Update local state
      set(state => {
        const updatedActivities = { ...state.activities };
        
        // Remove from all columns
        Object.keys(updatedActivities).forEach(columnId => {
          updatedActivities[columnId] = updatedActivities[columnId].filter(act => 
            act._id !== activityId
          );
        });
        
        // Remove from meta activities
        const updatedMetaActivities = state.metaActivities.filter(act => 
          act._id !== activityId
        );
        
        return {
          activities: updatedActivities,
          metaActivities: updatedMetaActivities,
          deletingActivityId: ''
        };
      });
      
      toast.success('Activity deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to delete activity', { 
        description: errorMessage
      });
      set({ deletingActivityId: '' });
      throw err;
    }
  },
  
  moveActivity: async (boardId: string, activityId: string, targetColumnId: string) => {
    // Find the activity to move
    let activityToMove: ExtendedActivity | undefined;
    let sourceColumnId: string | undefined;
    
    // Find the activity and its source column
    Object.entries(get().activities).forEach(([columnId, activities]) => {
      const found = activities.find(act => act._id === activityId);
      if (found) {
        activityToMove = found;
        sourceColumnId = columnId;
      }
    });
    
    if (!activityToMove || !sourceColumnId || sourceColumnId === targetColumnId) {
      return;
    }
    
    // Don't move meta activities
    if (activityToMove.type === 'meta') {
      toast.error("Class activities can't be moved.");
      return;
    }
    
    // Optimistically update UI
    set(state => {
      const updatedActivities = { ...state.activities };
      
      // Remove from source column
      updatedActivities[sourceColumnId!] = updatedActivities[sourceColumnId!].filter(
        act => act._id !== activityId
      );
      
      // Add to target column
      if (!updatedActivities[targetColumnId]) {
        updatedActivities[targetColumnId] = [];
      }
      
      updatedActivities[targetColumnId] = [
        ...updatedActivities[targetColumnId],
        { ...activityToMove!, columnId: targetColumnId }
      ];
      
      return { activities: updatedActivities };
    });
    
    const toastId = toast.loading('Updating activity...');
    
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: targetColumnId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity column');
      }
      
      toast.success('Activity moved successfully', { id: toastId });
    } catch (err) {
      // Revert the optimistic update
      set(state => {
        const updatedActivities = { ...state.activities };
        
        // Remove from target column
        updatedActivities[targetColumnId] = updatedActivities[targetColumnId].filter(
          act => act._id !== activityId
        );
        
        // Add back to source column
        if (!updatedActivities[sourceColumnId!]) {
          updatedActivities[sourceColumnId!] = [];
        }
        
        updatedActivities[sourceColumnId!] = [
          ...updatedActivities[sourceColumnId!],
          { ...activityToMove!, columnId: sourceColumnId }
        ];
        
        return { activities: updatedActivities };
      });
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error('Failed to move activity', { id: toastId });
    }
  },
  
  // UI Actions
  selectActivity: (activity: ExtendedActivity | null) => {
    set({ selectedActivity: activity });
  },
  
  openActivityDetail: (activity: ExtendedActivity) => {
    set({ 
      selectedActivity: activity,
      isActivityDetailOpen: true 
    });
  },
  
  closeActivityDetail: () => {
    set({ isActivityDetailOpen: false });
  },
  
  openCreateActivity: (columnId: string | null) => {
    set({ 
      isCreateActivityOpen: true,
      preSelectedColumn: columnId 
    });
  },
  
  closeCreateActivity: () => {
    set({ 
      isCreateActivityOpen: false,
      preSelectedColumn: null 
    });
  },
  
  setDeletingActivityId: (activityId: string) => {
    set({ deletingActivityId: activityId });
  },
  
  openMetaActivityDetail: (activity: ExtendedActivity) => {
    set({ 
      detailMetaActivity: activity,
      isMetaActivityDetailOpen: true 
    });
  },
  
  closeMetaActivityDetail: () => {
    set({ isMetaActivityDetailOpen: false });
  },
  
  // Meta activity selection actions
  toggleMetaActivitySelection: async (activityId: string) => {
    // This method no longer needs to fetch assignments since that's handled elsewhere
    // It just updates the selection state
    set(state => {
      const newSelection = new Set(state.selectedMetaActivities);
      if (newSelection.has(activityId)) {
        newSelection.delete(activityId);
      } else {
        newSelection.add(activityId);
      }
      return { selectedMetaActivities: newSelection };
    });
  },
  
  selectAllMetaActivities: async () => {
    const { metaActivities, metaActivitySearchQuery } = get();
    
    // Filter activities by search query if provided
    const filteredActivities = metaActivitySearchQuery
      ? metaActivities.filter(activity =>
          activity.title.toLowerCase().includes(metaActivitySearchQuery.toLowerCase())
        )
      : metaActivities;
    
    // Create a new Set with all activity IDs
    const allIds = new Set<string>();
    filteredActivities.forEach(activity => {
      if (activity._id) {
        allIds.add(activity._id);
      }
    });
    
    set({ selectedMetaActivities: allIds });
  },
  
  clearMetaActivitySelection: () => {
    set({ selectedMetaActivities: new Set() });
  },
  
  setMetaActivitySearchQuery: (query: string) => {
    set({ metaActivitySearchQuery: query });
  },
  
  // Reset
  reset: () => {
    set({
      activities: {},
      metaActivities: [],
      isLoading: false,
      selectedActivity: null,
      isActivityDetailOpen: false,
      isCreateActivityOpen: false,
      preSelectedColumn: null,
      deletingActivityId: '',
      isMetaActivityDetailOpen: false,
      detailMetaActivity: null,
      selectedMetaActivities: new Set<string>(),
      metaActivitySearchQuery: ''
    });
  }
})); 