import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DifficultyLevel } from '@/types/activities';

interface FiltersState {
  // Student filters
  selectedStudentFilters: Set<string>;
  tempStudentFilters: Set<string>;
  studentSearchQuery: string;
  isStudentFilterOpen: boolean;
  
  // Tag filters
  selectedTagFilters: Set<string>;
  tempTagFilters: Set<string>;
  tagSearchQuery: string;
  
  // Difficulty filters
  selectedDifficultyFilters: Set<DifficultyLevel>;
  tempDifficultyFilters: Set<DifficultyLevel>;
  
  // Activity filters
  selectedActivityFilters: Set<string>;
  tempActivityFilters: Set<string>;
  activitySearchQuery: string;
  
  // General filter state
  activeFilterTab: 'students' | 'tags' | 'difficulty' | 'activities';
  
  // Actions
  setSelectedStudentFilters: (filters: Set<string>) => void;
  setTempStudentFilters: (filters: Set<string>) => void;
  setStudentSearchQuery: (query: string) => void;
  setIsStudentFilterOpen: (isOpen: boolean) => void;
  
  setSelectedTagFilters: (filters: Set<string>) => void;
  setTempTagFilters: (filters: Set<string>) => void;
  setTagSearchQuery: (query: string) => void;
  
  setSelectedDifficultyFilters: (filters: Set<DifficultyLevel>) => void;
  setTempDifficultyFilters: (filters: Set<DifficultyLevel>) => void;
  
  setSelectedActivityFilters: (filters: Set<string>) => void;
  setTempActivityFilters: (filters: Set<string>) => void;
  setActivitySearchQuery: (query: string) => void;
  
  setActiveFilterTab: (tab: 'students' | 'tags' | 'difficulty' | 'activities') => void;
  
  applyFilters: () => void;
  clearAllFilters: () => void;
  reset: () => void;
}

// Helper function to convert Set to array for persistence
const setToArray = <T>(set: Set<T>): T[] => Array.from(set);

// Helper function to convert array to Set after rehydration
const arrayToSet = <T>(array: T[] | undefined): Set<T> => new Set(array || []);

// Define serializable state for persistence
interface StorableFiltersState {
  selectedStudentFilters: string[];
  tempStudentFilters: string[];
  selectedTagFilters: string[];
  tempTagFilters: string[];
  selectedDifficultyFilters: DifficultyLevel[];
  tempDifficultyFilters: DifficultyLevel[];
  selectedActivityFilters: string[];
  tempActivityFilters: string[];
  studentSearchQuery: string;
  isStudentFilterOpen: boolean;
  tagSearchQuery: string;
  activitySearchQuery: string;
  activeFilterTab: 'students' | 'tags' | 'difficulty' | 'activities';
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedStudentFilters: new Set<string>(),
      tempStudentFilters: new Set<string>(),
      studentSearchQuery: '',
      isStudentFilterOpen: false,
      
      selectedTagFilters: new Set<string>(),
      tempTagFilters: new Set<string>(),
      tagSearchQuery: '',
      
      selectedDifficultyFilters: new Set<DifficultyLevel>(),
      tempDifficultyFilters: new Set<DifficultyLevel>(),
      
      selectedActivityFilters: new Set<string>(),
      tempActivityFilters: new Set<string>(),
      activitySearchQuery: '',
      
      activeFilterTab: 'students',
      
      // Actions
      setSelectedStudentFilters: (filters: Set<string>) => {
        set({ selectedStudentFilters: filters });
      },
      
      setTempStudentFilters: (filters: Set<string>) => {
        set({ tempStudentFilters: filters });
      },
      
      setStudentSearchQuery: (query: string) => {
        set({ studentSearchQuery: query });
      },
      
      setIsStudentFilterOpen: (isOpen: boolean) => {
        set({ isStudentFilterOpen: isOpen });
        
        // When opening the filter, initialize temp filters with current selection
        if (isOpen) {
          set({ tempStudentFilters: new Set(get().selectedStudentFilters) });
        }
      },
      
      setSelectedTagFilters: (filters: Set<string>) => {
        set({ selectedTagFilters: filters });
      },
      
      setTempTagFilters: (filters: Set<string>) => {
        set({ tempTagFilters: filters });
      },
      
      setTagSearchQuery: (query: string) => {
        set({ tagSearchQuery: query });
      },
      
      setSelectedDifficultyFilters: (filters: Set<DifficultyLevel>) => {
        set({ selectedDifficultyFilters: filters });
      },
      
      setTempDifficultyFilters: (filters: Set<DifficultyLevel>) => {
        set({ tempDifficultyFilters: filters });
      },
      
      setSelectedActivityFilters: (filters: Set<string>) => {
        set({ selectedActivityFilters: filters });
      },
      
      setTempActivityFilters: (filters: Set<string>) => {
        set({ tempActivityFilters: filters });
      },
      
      setActivitySearchQuery: (query: string) => {
        set({ activitySearchQuery: query });
      },
      
      setActiveFilterTab: (tab: 'students' | 'tags' | 'difficulty' | 'activities') => {
        set({ activeFilterTab: tab });
      },
      
      applyFilters: () => {
        const { tempStudentFilters, tempTagFilters, tempDifficultyFilters, tempActivityFilters } = get();
        
        set({
          selectedStudentFilters: new Set(tempStudentFilters),
          selectedTagFilters: new Set(tempTagFilters),
          selectedDifficultyFilters: new Set(tempDifficultyFilters),
          selectedActivityFilters: new Set(tempActivityFilters),
          isStudentFilterOpen: false // Close the filter panel after applying
        });
      },
      
      clearAllFilters: () => {
        set({
          selectedStudentFilters: new Set(),
          tempStudentFilters: new Set(),
          selectedTagFilters: new Set(),
          tempTagFilters: new Set(),
          selectedDifficultyFilters: new Set(),
          tempDifficultyFilters: new Set(),
          selectedActivityFilters: new Set(),
          tempActivityFilters: new Set()
        });
      },
      
      reset: () => {
        set({
          selectedStudentFilters: new Set(),
          tempStudentFilters: new Set(),
          studentSearchQuery: '',
          isStudentFilterOpen: false,
          selectedTagFilters: new Set(),
          tempTagFilters: new Set(),
          tagSearchQuery: '',
          selectedDifficultyFilters: new Set(),
          tempDifficultyFilters: new Set(),
          selectedActivityFilters: new Set(),
          tempActivityFilters: new Set(),
          activitySearchQuery: '',
          activeFilterTab: 'students'
        });
      }
    }),
    {
      name: 'intellect-kanban-filters',
      
      // Convert Sets to arrays for storage and back to Sets when rehydrating
      partialize: (state): StorableFiltersState => ({
        selectedStudentFilters: setToArray(state.selectedStudentFilters),
        tempStudentFilters: setToArray(state.tempStudentFilters),
        selectedTagFilters: setToArray(state.selectedTagFilters),
        tempTagFilters: setToArray(state.tempTagFilters),
        selectedDifficultyFilters: setToArray(state.selectedDifficultyFilters),
        tempDifficultyFilters: setToArray(state.tempDifficultyFilters),
        selectedActivityFilters: setToArray(state.selectedActivityFilters),
        tempActivityFilters: setToArray(state.tempActivityFilters),
        studentSearchQuery: state.studentSearchQuery,
        isStudentFilterOpen: state.isStudentFilterOpen,
        tagSearchQuery: state.tagSearchQuery,
        activitySearchQuery: state.activitySearchQuery,
        activeFilterTab: state.activeFilterTab
      }),
      
      // Convert arrays back to Sets
      onRehydrateStorage: (state) => {
        if (!state) return;
        
        return (rehydratedState, error) => {
          if (error) {
            console.error('Error rehydrating filters state:', error);
            return;
          }
          
          if (rehydratedState) {
            // Convert arrays back to Sets
            rehydratedState.selectedStudentFilters = arrayToSet(rehydratedState.selectedStudentFilters as unknown as string[]);
            rehydratedState.tempStudentFilters = arrayToSet(rehydratedState.tempStudentFilters as unknown as string[]);
            rehydratedState.selectedTagFilters = arrayToSet(rehydratedState.selectedTagFilters as unknown as string[]);
            rehydratedState.tempTagFilters = arrayToSet(rehydratedState.tempTagFilters as unknown as string[]);
            rehydratedState.selectedDifficultyFilters = arrayToSet(rehydratedState.selectedDifficultyFilters as unknown as DifficultyLevel[]);
            rehydratedState.tempDifficultyFilters = arrayToSet(rehydratedState.tempDifficultyFilters as unknown as DifficultyLevel[]);
            rehydratedState.selectedActivityFilters = arrayToSet(rehydratedState.selectedActivityFilters as unknown as string[]);
            rehydratedState.tempActivityFilters = arrayToSet(rehydratedState.tempActivityFilters as unknown as string[]);
          }
        };
      }
    }
  )
); 