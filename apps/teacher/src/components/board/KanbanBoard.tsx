"use client";

import { useState, useEffect } from 'react';
import { Button, Skeleton, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, Checkbox, Avatar, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Tabs, TabsContent, TabsList, TabsTrigger } from '@intellect-kanban/ui';
import { toast } from 'sonner';
import { Board, Activity as ActivityType, StudentOption } from '@/utils/types';
import { Assignment } from '@/utils/types/assignment';
import { BoardHeader } from './BoardHeader';
import { ActivityDetailDialog } from './ActivityDetailDialog';
import { PriorityBadge } from './PriorityBadge';
import { CreateActivityDialog } from './CreateActivityDialog';
import { PlusIcon, CheckCircle, Circle, CheckSquare, Square, Filter, AlertCircle, Calendar, UsersIcon, Search, ChevronLeft, ChevronRight, X, Tag as TagIcon } from 'lucide-react';
import { KanbanActivityCard } from './KanbanActivityCard';
import { AssignmentCard } from './AssignmentCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@intellect-kanban/ui';
import { MetaActivityCard } from './MetaActivityCard';
import { ManageStudentsDialog } from './ManageStudentsDialog';
import { TagsProvider } from '@/contexts/TagsContext';
import { Tag as TagType } from '@/types/tags';
import { DifficultyLevel, difficultyLevelLabels, difficultyLevelColors } from '@/types/activities';

// New interface for MetaActivities display
interface MetaColumn {
  id: 'meta-activities';
  name: 'Class Activities';
  order: -1;
}

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoard({ boardId }: KanbanBoardProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  
  // State for drag and drop functionality
  const [draggingActivity, setDraggingActivity] = useState<string | null>(null);
  const [draggingFromColumn, setDraggingFromColumn] = useState<string | null>(null);

  // State for activity detail dialog
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  
  // State for create activity dialog
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [preSelectedColumn, setPreSelectedColumn] = useState<string | null>(null);

  // Real activities from API
  const [activities, setActivities] = useState<Record<string, any[]>>({});
  
  // Track current view mode (personal/meta)
  const [currentView, setCurrentView] = useState<'personal' | 'class'>('personal');

  // Meta activities column definition
  const metaColumn: MetaColumn = {
    id: 'meta-activities',
    name: 'Class Activities',
    order: -1
  };

  // Add these states to the KanbanBoard component
  const [selectedMetaActivities, setSelectedMetaActivities] = useState<Set<string>>(new Set());
  const [assignmentsByActivity, setAssignmentsByActivity] = useState<Record<string, Assignment[]>>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<Record<string, boolean>>({});

  // Add these states to the KanbanBoard component
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFilters, setSelectedStudentFilters] = useState<Set<string>>(new Set());
  const [tempStudentFilters, setTempStudentFilters] = useState<Set<string>>(new Set());
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Add new filter states for tags and difficulty levels
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const [tempTagFilters, setTempTagFilters] = useState<Set<string>>(new Set());
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedDifficultyFilters, setSelectedDifficultyFilters] = useState<Set<DifficultyLevel>>(new Set());
  const [tempDifficultyFilters, setTempDifficultyFilters] = useState<Set<DifficultyLevel>>(new Set());
  
  // Add state for advanced filter tabs
  const [activeFilterTab, setActiveFilterTab] = useState<'students' | 'tags' | 'difficulty'>('students');
  
  // Add state for managing students dialog
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isStudentFilterOpen, setIsStudentFilterOpen] = useState(false);

  // Add a state for tracking activities being deleted
  const [deletingActivityId, setDeletingActivityId] = useState<string>('');

  // Separate useEffect for fetching activities after board is loaded
  useEffect(() => {
    if (board && board._id) {
      console.log('Board loaded, fetching activities for board:', board._id);
      fetchActivities(board._id);
    }
  }, [board]);

  // Update the original fetchBoard useEffect to not call fetchActivities
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching board data for ID:', boardId);
        const response = await fetch(`/api/board/${boardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load board data');
        }

        const boardData = await response.json();
        console.log('Board data received:', boardData);
        
        // Check if board has columns
        if (!boardData.columns || boardData.columns.length === 0) {
          console.warn('Board has no columns defined');
        } else {
          console.log('Board columns:', boardData.columns);
        }
        
        setBoard(boardData);
        
        // Store students from board data for activity assignment
        if (boardData.students) {
          console.log('Students data available:', boardData.students.length);
          setStudents(boardData.students);
        } else {
          console.warn('No students data in board response');
        }
        
        // Activities will be fetched by the separate useEffect
      } catch (err) {
        console.error('Error fetching board:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading the board');
        toast.error('Failed to load board', {
          description: err instanceof Error ? err.message : 'Please try again later',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);
  
  // Fetch activities for the board
  const fetchActivities = async (boardId: string) => {
    try {
      setIsLoadingActivities(true);
      console.log('Fetching activities for board:', boardId);
      
      // Use the new API route
      const response = await fetch(`/api/board/${boardId}/activities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Failed to load activities: ${response.status}`);
      }

      const activitiesData = await response.json();
      console.log('Activities data received:', activitiesData);
      
      if (!Array.isArray(activitiesData)) {
        console.error('Expected array of activities, got:', typeof activitiesData);
        toast.error('Invalid activities data format');
        return;
      }
      
      // Debug the structure of first activity if available
      if (activitiesData.length > 0) {
        console.log('Sample activity structure:', activitiesData[0]);
        if (!activitiesData[0]._id) {
          console.warn('Activity is missing _id field:', activitiesData[0]);
        }
      } else {
        console.log('No activities returned from API');
      }
      
      // Group activities by column
      const groupedActivities: Record<string, any[]> = {};
      
      // Initialize empty arrays for all columns
      if (board?.columns) {
        board.columns.forEach(column => {
          groupedActivities[column.id] = [];
        });
      } else {
        console.warn('No columns defined in board');
      }
      
      // Group activities by their column
      activitiesData.forEach((activity: any) => {
        // Ensure activity has required fields
        if (!activity._id) {
          console.warn('Activity is missing _id field:', activity);
          return; // Skip this activity
        }
        
        // If columnId is not set, default to first column
        const columnId = activity.columnId || (board?.columns && board.columns.length > 0 ? board.columns[0].id : null);
        
        if (columnId) {
          if (!groupedActivities[columnId]) {
            // If column doesn't exist in our groupedActivities, create it
            groupedActivities[columnId] = [];
          }
          groupedActivities[columnId].push(activity);
        } else {
          console.warn('Activity has no valid columnId and no default column available:', activity);
        }
      });
      
      console.log('Grouped activities:', groupedActivities);
      
      // Make sure the meta-activities column exists for class view
      groupedActivities['meta-activities'] = [];
      
      // Put meta activities in the special column
      activitiesData.forEach((activity: any) => {
        if (activity.type === 'meta') {
          if (!groupedActivities['meta-activities']) {
            groupedActivities['meta-activities'] = [];
          }
          groupedActivities['meta-activities'].push(activity);
        }
      });
      
      setActivities(groupedActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      toast.error('Failed to load activities', {
        description: err instanceof Error ? err.message : 'Please try refreshing the page',
      });
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // Handle creating a new activity
  const handleActivityCreated = (newActivity: any) => {
    // Add the new activity to the appropriate column
    if (newActivity?.columnId) {
      setActivities(prev => {
        const updatedActivities = { ...prev };
        if (!updatedActivities[newActivity.columnId]) {
          updatedActivities[newActivity.columnId] = [];
        }
        updatedActivities[newActivity.columnId] = [...updatedActivities[newActivity.columnId], newActivity];
        
        // If it's a meta activity, also add it to the meta-activities column
        if (newActivity.type === 'meta') {
          if (!updatedActivities['meta-activities']) {
            updatedActivities['meta-activities'] = [];
          }
          updatedActivities['meta-activities'] = [...updatedActivities['meta-activities'], newActivity];
        }
        
        return updatedActivities;
      });
      
      toast.success('Activity created successfully');
    } else if (board?.columns && board.columns.length > 0) {
      // If no column specified, add to the first column
      const firstColumnId = board.columns[0].id;
      setActivities(prev => {
        const updatedActivities = { ...prev };
        if (!updatedActivities[firstColumnId]) {
          updatedActivities[firstColumnId] = [];
        }
        updatedActivities[firstColumnId] = [...updatedActivities[firstColumnId], {...newActivity, columnId: firstColumnId}];
        
        // If it's a meta activity, also add it to the meta-activities column
        if (newActivity.type === 'meta') {
          if (!updatedActivities['meta-activities']) {
            updatedActivities['meta-activities'] = [];
          }
          updatedActivities['meta-activities'] = [...updatedActivities['meta-activities'], {...newActivity, columnId: firstColumnId}];
        }
        
        return updatedActivities;
      });
      
      toast.success('Activity created successfully');
    }
  };

  // Activity detail handlers
  const handleOpenActivityDetail = (activity: any) => {
    setSelectedActivity(activity);
    setIsActivityDetailOpen(true);
  };

  const handleCloseActivityDetail = () => {
    setIsActivityDetailOpen(false);
    // We can keep the selectedActivity to prevent UI flashing during dialog close animation
    // or clear it after a small delay
    setTimeout(() => setSelectedActivity(null), 300);
  };

  // Drag and drop handlers
  const handleDragStart = (activityId: string, columnId: string) => {
    // Don't allow dragging from meta column
    if (columnId === 'meta-activities') return;
    
    setDraggingActivity(activityId);
    setDraggingFromColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    // Don't allow dropping in meta column
    if (columnId === 'meta-activities') {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    
    // Don't allow dropping in meta column
    if (columnId === 'meta-activities') return;
    
    if (!draggingActivity || !draggingFromColumn || draggingFromColumn === columnId) {
      return;
    }

    // Find the activity in the source column
    const activity = activities[draggingFromColumn]?.find(act => act._id === draggingActivity);
    
    if (!activity) return;
    
    // Block dragging meta activities
    if (activity.type === 'meta') {
      toast.error("Class activities can't be moved between columns");
      return;
    }
    
    // Create updated activities state
    const updatedActivities = { ...activities };
    
    // Remove from source column
    updatedActivities[draggingFromColumn] = activities[draggingFromColumn].filter(
      act => act._id !== draggingActivity
    );
    
    // Add to target column
    if (!updatedActivities[columnId]) {
      updatedActivities[columnId] = [];
    }

    // Update the activity's columnId before adding to the target column
    const updatedActivity = { ...activity, columnId: columnId };
    updatedActivities[columnId] = [...updatedActivities[columnId], updatedActivity];
    
    // Update state
    setActivities(updatedActivities);
    
    // Reset drag state
    setDraggingActivity(null);
    setDraggingFromColumn(null);
    
    // Show loading notification
    const toastId = toast.loading('Updating activity...');
    
    // Call API to update the activity's column
    updateActivityColumn(activity._id, columnId)
      .then(() => {
        toast.success('Activity moved successfully', { id: toastId });
      })
      .catch(error => {
        console.error('Error updating activity column:', error);
        toast.error('Failed to update activity', { id: toastId });
        
        // Revert the UI change on error
        setActivities(activities);
      });
  };
  
  // Function to update activity column via API
  const updateActivityColumn = async (activityId: string, columnId: string) => {
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${activityId}/column`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columnId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update activity column');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating activity column:', error);
      throw error;
    }
  };

  // Handle view change between personal and class
  const handleViewChange = (view: 'personal' | 'class') => {
    setCurrentView(view);
  };

  // Update selection logic function
  const toggleMetaActivitySelection = async (activityId: string) => {
    const newSelection = new Set(selectedMetaActivities);
    
    if (newSelection.has(activityId)) {
      // Deselect: remove activity and its assignments
      newSelection.delete(activityId);
      setSelectedMetaActivities(newSelection);
      
      // Remove assignments for this activity from display
      setAssignmentsByActivity(prev => {
        const updated = { ...prev };
        delete updated[activityId];
        return updated;
      });
    } else {
      // Select: add activity and fetch its assignments
      newSelection.add(activityId);
      setSelectedMetaActivities(newSelection);
      
      // Mark as loading
      setIsLoadingAssignments(prev => ({ ...prev, [activityId]: true }));
      
      try {
        // Fetch assignments for this activity
        const response = await fetch(`/api/assignments/activity/${activityId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assignments');
        }
        
        const assignmentsData = await response.json();
        
        // Store assignments by activity
        setAssignmentsByActivity(prev => ({
          ...prev,
          [activityId]: assignmentsData
        }));
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast.error('Failed to load assignments');
        // Remove from selection on error
        newSelection.delete(activityId);
        setSelectedMetaActivities(newSelection);
      } finally {
        // Clear loading state
        setIsLoadingAssignments(prev => ({ ...prev, [activityId]: false }));
      }
    }
  };

  // Add a selectAll function - optimized version
  const selectAllMetaActivities = async () => {
    // Skip if already loading assignments
    if (Object.values(isLoadingAssignments).some(loading => loading)) {
      return;
    }
    
    const metaActivities = activities['meta-activities'] || [];
    
    // If all are selected, deselect all
    if (metaActivities.length > 0 && selectedMetaActivities.size === metaActivities.length) {
      setSelectedMetaActivities(new Set());
      setAssignmentsByActivity({});
      return;
    }
    
    // Otherwise, select all
    const newSelection = new Set<string>();
    const newLoadingState: Record<string, boolean> = {};
    
    // Add all activity IDs to selection
    metaActivities.forEach(activity => {
        const activityId = activity._id;
      
      // Only mark as loading if we don't already have the assignments
      if (!assignmentsByActivity[activityId]) {
        newLoadingState[activityId] = true;
      }
      
        newSelection.add(activityId);
    });
    
    // Update selection immediately to show UI feedback
    setSelectedMetaActivities(newSelection);
    
    // If no new assignments to load, return early
    if (Object.keys(newLoadingState).length === 0) {
      return;
    }
    
    // Update loading state
    setIsLoadingAssignments(prev => ({ ...prev, ...newLoadingState }));
    
    // Batch fetch assignments using Promise.all for parallelism
    try {
      const activityIds = Object.keys(newLoadingState);
      const assignmentPromises = activityIds.map(async (activityId) => {
        try {
          const response = await fetch(`/api/assignments/activity/${activityId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch assignments for ${activityId}`);
          }
          
          return { activityId, assignments: await response.json() };
        } catch (error) {
          console.error(`Error fetching assignments for ${activityId}:`, error);
          return { activityId, assignments: [] };
        }
      });
      
      // Wait for all fetches to complete
      const results = await Promise.all(assignmentPromises);
      
      // Update assignments state
      const newAssignments: Record<string, any[]> = { ...assignmentsByActivity };
      results.forEach(({ activityId, assignments }) => {
        newAssignments[activityId] = assignments;
      });
      
      setAssignmentsByActivity(newAssignments);
    } catch (error) {
      console.error('Error selecting all activities:', error);
      toast.error('Failed to load some assignments', {
        description: 'Some assignments may not be displayed correctly'
      });
    } finally {
      // Clear loading state
      const clearedLoadingState: Record<string, boolean> = {};
      Object.keys(newLoadingState).forEach(activityId => {
        clearedLoadingState[activityId] = false;
      });
      setIsLoadingAssignments(prev => ({ ...prev, ...clearedLoadingState }));
    }
  };

  // Helper to get activity title from the assignments
  const getActivityTitle = (activityId: string | object) => {
    if (typeof activityId === 'object' && activityId && 'title' in activityId) {
      return (activityId as any).title;
    }
    
    // Try to find the activity in the meta activities column
    if (typeof activityId === 'string' && activities['meta-activities']) {
      const activity = activities['meta-activities'].find(a => a._id === activityId);
      if (activity) {
        return activity.title;
      }
    }
    
    return 'Unknown Activity';
  };

  // Add this function to filter meta activities by search query
  const getFilteredMetaActivities = () => {
    const metaActivities = activities['meta-activities'] || [];
    
    if (!searchQuery.trim()) {
      return metaActivities;
    }
    
    return metaActivities.filter(activity => 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Add handler for managing students
  const handleManageStudents = (activity: any) => {
    setSelectedActivity(activity);
    setIsManageStudentsOpen(true);
  };
  
  // Add handler for when students are updated
  const handleStudentsUpdated = async () => {
    // Refresh activities to get updated student assignments
    if (board && board._id) {
      await fetchActivities(board._id);
      
      // Also refresh assignments for any selected meta activities
      const currentlySelectedActivities = Array.from(selectedMetaActivities);
      if (currentlySelectedActivities.length > 0) {
        // Show loading indicators
        const loadingState: Record<string, boolean> = {};
        currentlySelectedActivities.forEach(activityId => {
          loadingState[activityId] = true;
        });
        setIsLoadingAssignments(prev => ({ ...prev, ...loadingState }));
        
        try {
          // Fetch assignments for each selected activity
          const assignmentPromises = currentlySelectedActivities.map(async (activityId) => {
            try {
              const response = await fetch(`/api/assignments/activity/${activityId}`);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch assignments for ${activityId}`);
              }
              
              return { activityId, assignments: await response.json() };
            } catch (error) {
              console.error(`Error refreshing assignments for ${activityId}:`, error);
              return { activityId, assignments: [] };
            }
          });
          
          const results = await Promise.all(assignmentPromises);
          
          // Update assignments state
          const updatedAssignments: Record<string, any[]> = { ...assignmentsByActivity };
          results.forEach(({ activityId, assignments }) => {
            updatedAssignments[activityId] = assignments;
          });
          
          setAssignmentsByActivity(updatedAssignments);
        } catch (error) {
          console.error('Error refreshing assignments:', error);
          toast.error('Failed to refresh some assignments');
        } finally {
          // Clear loading state
          const clearedLoadingState: Record<string, boolean> = {};
          currentlySelectedActivities.forEach(activityId => {
            clearedLoadingState[activityId] = false;
          });
          setIsLoadingAssignments(prev => ({ ...prev, ...clearedLoadingState }));
        }
      }
    }
  };

  // Get all assignments (unfiltered) for a column
  const getAllColumnAssignments = (columnId: string) => {
    if (currentView !== 'class' || columnId === 'meta-activities') {
      return []; // Only relevant for regular columns in class view
    }
    
    // Collect all assignments for selected meta activities that belong in this column
    // WITHOUT applying student filters
    const assignments: Assignment[] = [];
    
    // For each selected meta activity
    selectedMetaActivities.forEach(activityId => {
      const activityAssignments = assignmentsByActivity[activityId] || [];
      
      // Filter assignments for this column
      const columnAssignments = activityAssignments.filter(
        assignment => assignment.columnId === columnId
      );
      
      assignments.push(...columnAssignments);
    });
    
    return assignments;
  };

  // Get assignments for display in the columns (with filters applied)
  const getColumnAssignments = (columnId: string) => {
    if (currentView !== 'class' || columnId === 'meta-activities') {
      return []; // Only show assignments in regular columns of class view
    }
    
    // Get all assignments for this column
    const assignments = getAllColumnAssignments(columnId);
    
    // Start with all assignments
    let filteredAssignments = [...assignments];
    
    // Filter by selected students if any are selected
    if (selectedStudentFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        const studentId = typeof assignment.studentId === 'object' 
          ? assignment.studentId._id 
          : assignment.studentId;
        return selectedStudentFilters.has(studentId as string);
      });
    }
    
    // Filter by selected tags if any are selected
    if (selectedTagFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        // Get the associated activity
        const activityId = typeof assignment.activityId === 'object' 
          ? assignment.activityId._id 
          : assignment.activityId;
        
        // Find the activity in meta-activities column
        const activity = activities['meta-activities']?.find(
          act => act._id === activityId
        );
        
        if (!activity || !activity.tags || !Array.isArray(activity.tags)) {
          return false;
        }
        
        // Check if any of the activity's tags match our selected tag filters
        return activity.tags.some((tag: any) => {
          const tagId = typeof tag === 'object' ? tag._id : tag;
          return selectedTagFilters.has(tagId);
        });
      });
    }
    
    // Filter by selected difficulty levels if any are selected
    if (selectedDifficultyFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        // Get the associated activity
        const activityId = typeof assignment.activityId === 'object' 
          ? assignment.activityId._id 
          : assignment.activityId;
        
        // Find the activity in meta-activities column
        const activity = activities['meta-activities']?.find(
          act => act._id === activityId
        );
        
        // No difficulty level or not in selected filters
        if (!activity || !activity.difficultyLevel) {
          return false;
        }
        
        return selectedDifficultyFilters.has(activity.difficultyLevel as DifficultyLevel);
      });
    }
    
    return filteredAssignments;
  };
  
  // Function to get all unique students from selected meta activities
  const getUniqueStudentsFromSelectedActivities = (): { _id: string; name: string }[] => {
    const uniqueStudents = new Map<string, { _id: string; name: string }>();
    
    // Go through all assignments for selected activities
    selectedMetaActivities.forEach(activityId => {
      const activityAssignments = assignmentsByActivity[activityId] || [];
      
      activityAssignments.forEach(assignment => {
        if (typeof assignment.studentId === 'object' && assignment.studentId?._id) {
          const student = assignment.studentId;
          uniqueStudents.set(student._id, { 
            _id: student._id, 
            name: student.name || 'Unnamed Student'
          });
        } else if (typeof assignment.studentId === 'string') {
          // Try to find student in the students array
          const studentId = assignment.studentId;
          const student = students.find(s => s._id === studentId);
          
          if (student) {
            uniqueStudents.set(studentId, {
              _id: studentId,
              name: student.name || 'Unnamed Student'
            });
          }
        }
      });
    });
    
    return Array.from(uniqueStudents.values());
  };
  
  // Function to get all unique tags from selected meta activities
  const getUniqueTagsFromSelectedActivities = (): TagType[] => {
    const uniqueTags = new Map<string, TagType>();
    
    // Go through all selected activities to extract tags
    selectedMetaActivities.forEach(activityId => {
      const activity = activities['meta-activities']?.find(act => act._id === activityId);
      
      if (activity && activity.tags && Array.isArray(activity.tags)) {
        // Type-safe iteration over tags
        (activity.tags as any[]).forEach((tag) => {
          const tagId = typeof tag === 'object' && tag !== null ? tag._id : String(tag);
          const tagObj = typeof tag === 'object' && tag !== null ? tag as TagType : 
            { _id: tagId, name: 'Unknown Tag', color: '#6366F1', createdBy: '', createdAt: '', updatedAt: '' };
          
          if (tagId && !uniqueTags.has(tagId)) {
            uniqueTags.set(tagId, tagObj);
          }
        });
      }
    });
    
    return Array.from(uniqueTags.values());
  };
  
  // Function to get all unique difficulty levels from selected meta activities
  const getUniqueDifficultyLevelsFromSelectedActivities = (): { level: DifficultyLevel, label: string, color: string }[] => {
    const uniqueDifficulties = new Set<DifficultyLevel>();
    
    // Go through all selected activities to extract difficulty levels
    selectedMetaActivities.forEach(activityId => {
      const activity = activities['meta-activities']?.find(act => act._id === activityId);
      
      if (activity && activity.difficultyLevel) {
        uniqueDifficulties.add(activity.difficultyLevel as DifficultyLevel);
      }
    });
    
    // Convert to array with labels and colors
    return Array.from(uniqueDifficulties).map(level => ({
      level,
      label: difficultyLevelLabels[level],
      color: difficultyLevelColors[level]
    }));
  };
  
  // Get the appropriate count for the column badge
  const getColumnBadgeCount = (columnId: string) => {
    if (currentView === 'personal' || columnId === 'meta-activities') {
      // For personal view or meta column, use activity count
      return getFilteredActivities(columnId)?.length || 0;
    } else {
      // For class view regular columns, use assignment count
      return getColumnAssignments(columnId).length;
    }
  };

  // Update the handleActivityDeleted function to clear the pending state
  const handleActivityDeleted = (activityId: string) => {
    // Remove the activity from all columns
    setActivities(prev => {
      const updatedActivities = { ...prev };
      
      // Loop through all columns to find and remove the activity
      Object.keys(updatedActivities).forEach(columnId => {
        updatedActivities[columnId] = updatedActivities[columnId].filter(
          activity => activity._id !== activityId
        );
      });
      
      return updatedActivities;
    });

    // Clear the selected activity and pending deletion state
    setSelectedActivity(null);
    setDeletingActivityId('');
  };

  // Optimize the columns to not show loading when only specific activities are loading
  const areAllAssignmentsLoading = () => {
    return Object.values(isLoadingAssignments).some(loading => loading);
  };

  // Check if any assignments for selected activities might load in this column
  const mightHaveAssignmentsLoading = (columnId: string) => {
    // If no assignments in this column and some activities are loading,
    // there might be assignments coming to this column
    return getColumnAssignments(columnId).length === 0 && areAllAssignmentsLoading();
  };

  // Loading state
  if (isLoading) {
    // Try to match the number of columns if possible
    const columnCount = board?.columns?.length || 4;
    return (
      <div className="flex flex-col h-screen">
        {/* BoardHeader skeleton */}
        <div className="px-4 py-3 border-b mb-4 bg-background flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        {/* Board columns skeleton - responsive grid */}
        <div className="flex-1 overflow-hidden px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full auto-rows-max pb-4">
            {Array(columnCount).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !board) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-lg font-medium text-red-800">Failed to load board</h2>
        <p className="mt-1 text-red-700">{error || 'Board not found'}</p>
      </div>
    );
  }
  
  // Get filtered columns based on current view
  const getColumnsForView = () => {
    if (currentView === 'personal') {
      return board.columns;
    } else {
      // For class view, show both meta column and regular columns
      return [metaColumn, ...board.columns];
    }
  };
  
  // Get filtered activities by type
  const getFilteredActivities = (columnId: string) => {
    // If no activities for this column, return empty array
    if (!activities[columnId]) {
      return [];
    }
    
    if (currentView === 'personal') {
      // In personal view, show only personal activities
      return activities[columnId].filter(act => act.type === 'personal');
    } else {
      // In class view:
      if (columnId === 'meta-activities') {
        // Show only meta activities in the meta column 
        return activities[columnId] || [];
      } else {
        // In regular columns, show nothing by default (will show assignments instead)
        return [];
      }
    }
  };

  return (
    <TagsProvider boardId={boardId}>
      <div className="flex flex-col h-screen">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ) : (
          <div className="flex flex-col">
            {/* BoardHeader now serves as the main navbar */}
            <BoardHeader 
              board={board} 
              onActivityButtonClick={() => setIsCreateActivityOpen(true)}
              onViewChange={handleViewChange}
              currentView={currentView}
            />
          </div>
        )}

        {/* Board content - adjust for full screen */}
        <div className="flex-1 overflow-hidden px-4 pb-8">
          {currentView === 'class' ? (
            <div className="w-full h-full">
              {/* Main Board Area */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex h-full">
                  {/* Columns */}
                  <div className="flex gap-4 p-4 h-full min-w-max">
                    {/* Meta Activities Column */}
                    <div 
                      className="flex flex-col h-full border rounded-lg overflow-hidden bg-card min-w-[280px] max-w-[280px]"
                    >
                      {/* Column Header */}
                      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Class Activities</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {activities['meta-activities']?.length || 0}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {/* Filter button - only show when at least one activity is selected */}
                          {selectedMetaActivities.size > 0 && (
                            <DropdownMenu open={isStudentFilterOpen} onOpenChange={(open) => {
                              // When opening the dropdown, initialize temp filters with current selection
                              if (open) {
                                setTempStudentFilters(new Set(selectedStudentFilters));
                                setTempTagFilters(new Set(selectedTagFilters));
                                setTempDifficultyFilters(new Set(selectedDifficultyFilters));
                              } else {
                                // Reset search query when closing
                                setStudentSearchQuery('');
                                setTagSearchQuery('');
                              }
                              setIsStudentFilterOpen(open);
                            }}>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 relative"
                                >
                                  <Filter className="h-4 w-4" />
                                  {(selectedStudentFilters.size > 0 || selectedTagFilters.size > 0 || selectedDifficultyFilters.size > 0) && (
                                    <motion.span 
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1 bg-primary text-[10px] text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center"
                                    >
                                      {selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size}
                                    </motion.span>
                                  )}
                                  <span className="sr-only">Advanced filters</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" side="bottom" className="w-[280px] p-0 border-none shadow-lg rounded-lg" sideOffset={5}>
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-card border rounded-lg overflow-hidden"
                                >
                                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Advanced Filters</h4>
                                    <Badge variant="outline" className="font-normal text-xs">
                                      {selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size} active
                                    </Badge>
                                  </div>
                                  
                                  <Tabs 
                                    value={activeFilterTab} 
                                    onValueChange={(value) => setActiveFilterTab(value as 'students' | 'tags' | 'difficulty')} 
                                    className="w-full"
                                  >
                                    <div className="border-b">
                                      <TabsList className="w-full h-auto p-0 bg-transparent border-b rounded-none">
                                        <TabsTrigger 
                                          value="students" 
                                          className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <UsersIcon className="h-3.5 w-3.5" />
                                            <span>Students</span>
                                            {selectedStudentFilters.size > 0 && (
                                              <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                                                {selectedStudentFilters.size}
                                              </span>
                                            )}
                                          </div>
                                        </TabsTrigger>
                                        <TabsTrigger 
                                          value="tags" 
                                          className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <TagIcon className="h-3.5 w-3.5" />
                                            <span>Tags</span>
                                            {selectedTagFilters.size > 0 && (
                                              <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                                                {selectedTagFilters.size}
                                              </span>
                                            )}
                                          </div>
                                        </TabsTrigger>
                                        <TabsTrigger 
                                          value="difficulty" 
                                          className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Difficulty</span>
                                            {selectedDifficultyFilters.size > 0 && (
                                              <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                                                {selectedDifficultyFilters.size}
                                              </span>
                                            )}
                                          </div>
                                        </TabsTrigger>
                                      </TabsList>
                                    </div>
                                    
                                    {/* Students tab content */}
                                    <TabsContent value="students" className="p-3 focus-visible:outline-none focus-visible:ring-0">
                                  {/* Search input for students */}
                                  <div className="mb-3 relative">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                    <Input
                                      placeholder="Search students..."
                                      value={studentSearchQuery}
                                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                                      className="pl-7 h-7 text-xs"
                                    />
                                  </div>
                                  
                                      <div className="max-h-[200px] overflow-y-auto border rounded-md">
                                    {/* Get all unique students from selected activities */}
                                    {getUniqueStudentsFromSelectedActivities().length > 0 ? (
                                          <div className="divide-y">
                                        {/* Select All option */}
                                            <div className="p-2 bg-muted/30">
                                              <div className="flex items-center gap-2">
                                          <Checkbox 
                                            id="student-filter-select-all" 
                                            checked={tempStudentFilters.size === getUniqueStudentsFromSelectedActivities().length}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                // Select all students
                                                const allStudents = getUniqueStudentsFromSelectedActivities();
                                                const allIds = new Set(allStudents.map(s => s._id));
                                                setTempStudentFilters(allIds);
                                              } else {
                                                // Clear all selections
                                                setTempStudentFilters(new Set());
                                              }
                                            }}
                                          />
                                          <label 
                                            htmlFor="student-filter-select-all" 
                                                  className="text-xs font-medium cursor-pointer"
                                          >
                                            Select All
                                          </label>
                                              </div>
                                        </div>
                                        
                                            <div className="p-1">
                                        {getUniqueStudentsFromSelectedActivities()
                                          .filter(student => 
                                            !studentSearchQuery || 
                                            student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
                                          )
                                          .map(student => (
                                                  <div key={student._id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                                              <Checkbox 
                                                id={`student-filter-${student._id}`} 
                                                checked={tempStudentFilters.has(student._id)}
                                                onCheckedChange={(checked) => {
                                                  const newFilters = new Set(tempStudentFilters);
                                                  if (checked) {
                                                    newFilters.add(student._id);
                                                  } else {
                                                    newFilters.delete(student._id);
                                                  }
                                                  setTempStudentFilters(newFilters);
                                                }}
                                              />
                                              <label 
                                                htmlFor={`student-filter-${student._id}`} 
                                                      className="text-xs cursor-pointer flex items-center gap-2"
                                              >
                                                <Avatar className="h-5 w-5">
                                                  <AvatarFallback className="text-[9px]">
                                                    {student.name.substring(0, 2).toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                                      <span className="truncate">{student.name}</span>
                                              </label>
                                            </div>
                                          ))}
                                            </div>
                                      </div>
                                    ) : (
                                          <div className="text-xs text-muted-foreground text-center py-4">
                                        No students available
                                      </div>
                                    )}
                                  </div>
                                    </TabsContent>
                                    
                                    {/* Tags tab content */}
                                    <TabsContent value="tags" className="p-3 focus-visible:outline-none focus-visible:ring-0">
                                      {/* Search input for tags */}
                                      <div className="mb-3 relative">
                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                          placeholder="Search tags..."
                                          value={tagSearchQuery}
                                          onChange={(e) => setTagSearchQuery(e.target.value)}
                                          className="pl-7 h-7 text-xs"
                                        />
                                      </div>
                                      
                                      <div className="max-h-[200px] overflow-y-auto border rounded-md">
                                        {/* Get all unique tags from selected activities */}
                                        {getUniqueTagsFromSelectedActivities().length > 0 ? (
                                          <div className="divide-y">
                                            {/* Select All option */}
                                            <div className="p-2 bg-muted/30">
                                              <div className="flex items-center gap-2">
                                                <Checkbox 
                                                  id="tag-filter-select-all" 
                                                  checked={tempTagFilters.size === getUniqueTagsFromSelectedActivities().length}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      // Select all tags
                                                      const allTags = getUniqueTagsFromSelectedActivities();
                                                      const allIds = new Set(allTags.map(t => t._id));
                                                      setTempTagFilters(allIds);
                                                    } else {
                                                      // Clear all selections
                                                      setTempTagFilters(new Set());
                                                    }
                                                  }}
                                                />
                                                <label 
                                                  htmlFor="tag-filter-select-all" 
                                                  className="text-xs font-medium cursor-pointer"
                                                >
                                                  Select All
                                                </label>
                                              </div>
                                            </div>
                                            
                                            <div className="p-1">
                                              {getUniqueTagsFromSelectedActivities()
                                                .filter(tag => 
                                                  !tagSearchQuery || 
                                                  tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                                                )
                                                .map(tag => (
                                                  <div key={tag._id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                                                    <Checkbox 
                                                      id={`tag-filter-${tag._id}`} 
                                                      checked={tempTagFilters.has(tag._id)}
                                                      onCheckedChange={(checked) => {
                                                        const newFilters = new Set(tempTagFilters);
                                                        if (checked) {
                                                          newFilters.add(tag._id);
                                                        } else {
                                                          newFilters.delete(tag._id);
                                                        }
                                                        setTempTagFilters(newFilters);
                                                      }}
                                                    />
                                                    <label 
                                                      htmlFor={`tag-filter-${tag._id}`} 
                                                      className="text-xs cursor-pointer flex items-center gap-2"
                                                    >
                                                      <span 
                                                        className="h-3 w-3 rounded-full flex-shrink-0" 
                                                        style={{ backgroundColor: tag.color }}
                                                      ></span>
                                                      <span className="truncate">{tag.name}</span>
                                                    </label>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground text-center py-4">
                                            No tags available
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                    
                                    {/* Difficulty tab content */}
                                    <TabsContent value="difficulty" className="p-3 focus-visible:outline-none focus-visible:ring-0">
                                      <div className="max-h-[200px] overflow-y-auto border rounded-md">
                                        {/* Get all unique difficulty levels from selected activities */}
                                        {getUniqueDifficultyLevelsFromSelectedActivities().length > 0 ? (
                                          <div className="divide-y">
                                            {/* Select All option */}
                                            <div className="p-2 bg-muted/30">
                                              <div className="flex items-center gap-2">
                                                <Checkbox 
                                                  id="difficulty-filter-select-all" 
                                                  checked={tempDifficultyFilters.size === getUniqueDifficultyLevelsFromSelectedActivities().length}
                                                  onCheckedChange={(checked) => {
                                                    if (checked) {
                                                      // Select all difficulty levels
                                                      const allLevels = getUniqueDifficultyLevelsFromSelectedActivities();
                                                      const allIds = new Set(allLevels.map(d => d.level));
                                                      setTempDifficultyFilters(allIds);
                                                    } else {
                                                      // Clear all selections
                                                      setTempDifficultyFilters(new Set());
                                                    }
                                                  }}
                                                />
                                                <label 
                                                  htmlFor="difficulty-filter-select-all" 
                                                  className="text-xs font-medium cursor-pointer"
                                                >
                                                  Select All
                                                </label>
                                              </div>
                                            </div>
                                            
                                            <div className="p-1">
                                              {getUniqueDifficultyLevelsFromSelectedActivities()
                                                .map(difficulty => (
                                                  <div key={difficulty.level} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                                                    <Checkbox 
                                                      id={`difficulty-filter-${difficulty.level}`} 
                                                      checked={tempDifficultyFilters.has(difficulty.level)}
                                                      onCheckedChange={(checked) => {
                                                        const newFilters = new Set(tempDifficultyFilters);
                                                        if (checked) {
                                                          newFilters.add(difficulty.level);
                                                        } else {
                                                          newFilters.delete(difficulty.level);
                                                        }
                                                        setTempDifficultyFilters(newFilters);
                                                      }}
                                                    />
                                                    <label 
                                                      htmlFor={`difficulty-filter-${difficulty.level}`} 
                                                      className="text-xs cursor-pointer flex items-center gap-2"
                                                    >
                                                      <span 
                                                        className="h-3 w-3 rounded flex-shrink-0" 
                                                        style={{ backgroundColor: difficulty.color }}
                                                      ></span>
                                                      <span className="truncate">{difficulty.label}</span>
                                                    </label>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-xs text-muted-foreground text-center py-4">
                                            No difficulty levels available
                                          </div>
                                        )}
                                      </div>
                                    </TabsContent>
                                  </Tabs>
                                  
                                  <div className="p-3 border-t bg-muted/10 flex items-center justify-between">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        // Reset all temporary filters
                                        setTempStudentFilters(new Set());
                                        setTempTagFilters(new Set());
                                        setTempDifficultyFilters(new Set());
                                      }}
                                      disabled={tempStudentFilters.size === 0 && tempTagFilters.size === 0 && tempDifficultyFilters.size === 0}
                                      className="h-7 text-xs"
                                    >
                                      Clear all
                                    </Button>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setIsStudentFilterOpen(false)}
                                        className="h-7 text-xs"
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        variant="default" 
                                        size="sm"
                                        onClick={() => {
                                          // Apply all filters
                                          setSelectedStudentFilters(new Set(tempStudentFilters));
                                          setSelectedTagFilters(new Set(tempTagFilters));
                                          setSelectedDifficultyFilters(new Set(tempDifficultyFilters));
                                          setIsStudentFilterOpen(false);
                                        }}
                                        className="h-7 text-xs"
                                      >
                                        Apply
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={selectAllMetaActivities}
                            disabled={areAllAssignmentsLoading()}
                          >
                            {activities['meta-activities']?.length > 0 && 
                             selectedMetaActivities.size === activities['meta-activities']?.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                            <span className="sr-only">Select All</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Search Bar */}
                      <div className="px-3 py-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Activities List */}
                      <div className="flex-1 p-2 pb-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                        <AnimatePresence>
                          {isLoadingActivities ? (
                            // Skeleton loaders for activities
                            Array(3).fill(0).map((_, index) => (
                              <motion.div 
                                key={`skeleton-${index}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="mb-2 p-2 border rounded-md animate-pulse"
                              >
                                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
                                <div className="flex justify-between items-center">
                                  <div className="h-3 w-1/4 bg-muted-foreground/15 rounded"></div>
                                  <div className="h-3 w-1/6 bg-muted-foreground/15 rounded"></div>
                                </div>
                              </motion.div>
                            ))
                          ) : getFilteredMetaActivities().length === 0 ? (
                            // No activities or no search results
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground p-4 text-center"
                            >
                              {searchQuery ? (
                                <>
                                  <Filter className="h-10 w-10 text-muted-foreground/20 mb-2" />
                                  <p>No activities match your search</p>
                                  <Button 
                                    variant="link" 
                                    className="text-xs mt-1 h-auto p-0" 
                                    onClick={() => setSearchQuery('')}
                                  >
                                    Clear search
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-10 w-10 text-muted-foreground/20 mb-2" />
                                  <p>No class activities available</p>
                                </>
                              )}
                            </motion.div>
                          ) : (
                            // Activity list
                            getFilteredMetaActivities().map((activity, index) => (
                              <MetaActivityCard
                                key={activity._id}
                                activity={activity}
                                isSelected={selectedMetaActivities.has(activity._id)}
                                isLoading={isLoadingAssignments[activity._id]}
                                onSelect={toggleMetaActivitySelection}
                                onManageStudents={handleManageStudents}
                                isPendingDeletion={deletingActivityId === activity._id}
                              />
                            ))
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    {/* Regular Columns */}
                    {board.columns.map((column) => (
                      <div 
                        key={column.id}
                        className="flex flex-col h-full border rounded-lg overflow-hidden bg-card min-w-[280px] max-w-[280px]"
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDrop={(e) => handleDrop(e, column.id)}
                      >
                        {/* Column Header */}
                        <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{column.name}</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {getColumnBadgeCount(column.id)}
                            </span>
                            
                            {/* Show filtered vs total count when filters are active */}
                            {currentView === 'class' && selectedStudentFilters.size > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {getColumnAssignments(column.id).length}/{getAllColumnAssignments(column.id).length}
                              </span>
                            )}
                          </div>
                          {/* Student filter badge - only show in class view when filters are active */}
                          {currentView === 'class' && (selectedStudentFilters.size > 0 || selectedTagFilters.size > 0 || selectedDifficultyFilters.size > 0) && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="ml-auto mr-2 flex items-center gap-2"
                            >
                              {/* Show active filter counts */}
                              <div className="flex items-center gap-1">
                                {selectedStudentFilters.size > 0 && (
                                  <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                                    <UsersIcon className="h-2.5 w-2.5 mr-0.5" />
                                    {selectedStudentFilters.size}
                                  </Badge>
                                )}
                                {selectedTagFilters.size > 0 && (
                                  <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                                    <TagIcon className="h-2.5 w-2.5 mr-0.5" />
                                    {selectedTagFilters.size}
                                  </Badge>
                                )}
                                {selectedDifficultyFilters.size > 0 && (
                                  <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                                    {selectedDifficultyFilters.size}
                                  </Badge>
                                )}
                              </div>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5" 
                                onClick={() => {
                                  // Clear all filters
                                  setSelectedStudentFilters(new Set());
                                  setSelectedTagFilters(new Set());
                                  setSelectedDifficultyFilters(new Set());
                                }}
                                title="Clear filters"
                              >
                                <X className="h-3 w-3" />
                                <span className="sr-only">Clear filters</span>
                              </Button>
                            </motion.div>
                          )}
                        </div>

                        {/* Activities */}
                        <div className="flex-1 p-2 pb-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                          <AnimatePresence>
                            {/* Assignments in class view */}
                            {currentView === 'class' && column.id !== 'meta-activities' && (
                              <>
                                {getColumnAssignments(column.id).map((assignment) => (
                                  <AssignmentCard
                                    key={assignment._id}
                                    assignment={assignment}
                                    activityId={typeof assignment.activityId === 'object' ? assignment.activityId._id : assignment.activityId as string}
                                    onClick={() => {
                                      // Handle assignment click - could show details dialog
                                      toast.info('Assignment details coming soon');
                                    }}
                                  />
                                ))}
                                
                                {/* Only show column loading indicator if this column might receive assignments */}
                                {selectedMetaActivities.size > 0 && 
                                 mightHaveAssignmentsLoading(column.id) && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-center items-center p-4 text-sm text-muted-foreground"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    </div>
                                  </motion.div>
                                )}
                                
                                {/* Empty state for no assignments in a column - only show when not loading */}
                                {getColumnAssignments(column.id).length === 0 && 
                                 selectedMetaActivities.size > 0 && 
                                 !areAllAssignmentsLoading() && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md"
                                  >
                                    {selectedStudentFilters.size > 0 || selectedTagFilters.size > 0 || selectedDifficultyFilters.size > 0 ? (
                                      <>
                                        <Filter className="h-4 w-4 mb-2 text-muted-foreground/50" />
                                        <span>No matching assignments</span>
                                        <div className="text-xs mt-1 flex items-center gap-1.5 flex-wrap justify-center">
                                          {selectedStudentFilters.size > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                              <UsersIcon className="h-3 w-3" /> 
                                              {selectedStudentFilters.size}
                                        </span>
                                          )}
                                          {selectedTagFilters.size > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                              <TagIcon className="h-3 w-3" />
                                              {selectedTagFilters.size}
                                            </span>
                                          )}
                                          {selectedDifficultyFilters.size > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                              <AlertCircle className="h-3 w-3" />
                                              {selectedDifficultyFilters.size}
                                            </span>
                                          )}
                                          <span>filters active</span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <span>No assignments in {column.name}</span>
                                        <span className="text-xs mt-1">Drag assignments here</span>
                                      </>
                                    )}
                                  </motion.div>
                                )}
                                
                                {/* Message to select meta activities - only show when not loading */}
                                {selectedMetaActivities.size === 0 && 
                                 !isLoadingActivities && 
                                 currentView === 'class' &&
                                 column.id !== 'meta-activities' && (
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md"
                                  >
                                    <span>Select class activities</span>
                                    <span className="text-xs mt-1">to view student assignments</span>
                                  </motion.div>
                                )}
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Personal view - responsive grid that adjusts to screen width
            <div className="w-full h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max pb-4">
                {getColumnsForView().map((column) => (
                  <div 
                    key={column.id}
                    className="flex flex-col h-full border rounded-lg overflow-hidden bg-card"
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {/* Column Header */}
                    <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{column.name}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          {getColumnBadgeCount(column.id)}
                        </span>
                      </div>
                      {/* Only show add button in personal view */}
                      {(currentView as string) !== 'class' && (
                        <button 
                          className="text-xs text-muted-foreground hover:text-foreground p-1 rounded"
                          onClick={() => {
                            // Pre-select the current column and set the type to personal in the dialog
                            setPreSelectedColumn(column.id);
                            setIsCreateActivityOpen(true);
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>

                    {/* Activities */}
                    <div className="flex-1 p-2 pb-4 overflow-y-auto max-h-[calc(100vh-180px)]">
                      <div className="space-y-2">
                        {isLoadingActivities ? (
                          // Activity loading skeletons
                          Array(3).fill(0).map((_, index) => (
                            <div key={`skeleton-${index}`} className="rounded-md border p-2 animate-pulse">
                              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
                              <div className="flex justify-between items-center">
                                <div className="h-3 w-1/4 bg-muted-foreground/15 rounded"></div>
                                <div className="h-3 w-1/6 bg-muted-foreground/15 rounded"></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Actual activities filtered by view
                          getFilteredActivities(column.id)?.map((activity) => {
                            // Debug check
                            if (!activity || !activity._id) {
                              console.warn('Invalid activity detected in column', column.id, activity);
                              return null; // Skip rendering this invalid activity
                            }
                            
                            return (
                              <KanbanActivityCard 
                                key={activity._id}
                                activity={activity}
                                onClick={handleOpenActivityDetail}
                                isPendingDeletion={deletingActivityId === activity._id}
                                isMetaActivity={activity.type === 'meta'}
                                onDragStart={(e, activity) => {
                                  if (activity.type === 'meta') return;
                                  
                                  handleDragStart(activity._id, column.id);
                                  // Set ghost image data
                                  e.dataTransfer.setData('text/plain', activity._id);
                                }}
                              />
                            );
                          })
                        )}

                        {/* Empty state */}
                        {!isLoadingActivities && (!getFilteredActivities(column.id) || getFilteredActivities(column.id).length === 0) && (
                          <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-sm text-muted-foreground">
                            <span>No personal activities</span>
                            <span className="text-xs mt-1">Drop activities here</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Detail Dialog */}
        {selectedActivity && (
          <ActivityDetailDialog 
            isOpen={isActivityDetailOpen} 
            onOpenChange={setIsActivityDetailOpen} 
            activity={selectedActivity}
            columns={board?.columns || []}
            students={students}
            onActivityDeleted={handleActivityDeleted}
            onDeletePending={setDeletingActivityId}
          />
        )}

        {/* Create Activity Dialog */}
        <CreateActivityDialog
          isOpen={isCreateActivityOpen}
          onOpenChange={(open) => {
            setIsCreateActivityOpen(open);
            if (!open) {
              // Reset pre-selected column when dialog closes
              setPreSelectedColumn(null);
            }
          }}
          boardId={boardId}
          columns={board?.columns || []}
          students={students as any}
          onActivityCreated={handleActivityCreated}
          showMetaOption={true} // Always show meta option
          initialColumnId={preSelectedColumn}
        />

        {/* ManageStudentsDialog */}
        <ManageStudentsDialog
          isOpen={isManageStudentsOpen}
          onOpenChange={setIsManageStudentsOpen}
          activity={selectedActivity}
          classStudents={students}
          onStudentsUpdated={handleStudentsUpdated}
        />
      </div>
    </TagsProvider>
  );
}