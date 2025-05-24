"use client";

import { useState, useEffect } from 'react';
import { Button, Skeleton, Badge } from '@intellect-kanban/ui';
import { toast } from 'sonner';
import { Board, Activity as ActivityType, StudentOption } from '@/utils/types';
import { Assignment } from '@/utils/types/assignment';
import { BoardHeader } from './BoardHeader';
import { ActivityDetailDialog } from './ActivityDetailDialog';
import { PriorityBadge } from './PriorityBadge';
import { CreateActivityDialog } from './CreateActivityDialog';
import { PlusIcon, CheckCircle, Circle, CheckSquare, Square, Filter, AlertCircle, Calendar, UsersIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { KanbanActivityCard } from './KanbanActivityCard';
import { AssignmentCard } from './AssignmentCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@intellect-kanban/ui';
import { MetaActivityCard } from './MetaActivityCard';
import { ManageStudentsDialog } from './ManageStudentsDialog';

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
  const [isClassActivitiesSidebarOpen, setIsClassActivitiesSidebarOpen] = useState(true);

  // Add state for managing students dialog
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);

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

  // Add a selectAll function
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
    
    // Show loading indicator
    const loadingState: Record<string, boolean> = {};
    metaActivities.forEach(activity => {
      loadingState[activity._id] = true;
    });
    setIsLoadingAssignments(loadingState);
    
    try {
      // Fetch assignments for each activity
      const assignmentPromises = metaActivities.map(async (activity) => {
        const activityId = activity._id;
        newSelection.add(activityId);
        
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
      
      const results = await Promise.all(assignmentPromises);
      
      // Build updated assignments state
      const newAssignments: Record<string, any[]> = {};
      results.forEach(({ activityId, assignments }) => {
        newAssignments[activityId] = assignments;
      });
      
      setSelectedMetaActivities(newSelection);
      setAssignmentsByActivity(newAssignments);
    } catch (error) {
      console.error('Error selecting all activities:', error);
      toast.error('Failed to select all activities');
    } finally {
      // Clear loading state
      const clearedLoadingState: Record<string, boolean> = {};
      metaActivities.forEach(activity => {
        clearedLoadingState[activity._id] = false;
      });
      setIsLoadingAssignments(clearedLoadingState);
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
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full auto-rows-max">
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

  // Get assignments for display in the columns
  const getColumnAssignments = (columnId: string) => {
    if (currentView !== 'class' || columnId === 'meta-activities') {
      return []; // Only show assignments in regular columns of class view
    }
    
    // Collect all assignments for selected meta activities that belong in this column
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

  return (
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
            onToggleSidebar={() => setIsClassActivitiesSidebarOpen(prev => !prev)}
            isSidebarOpen={isClassActivitiesSidebarOpen}
          />
        </div>
      )}

      {/* Board content - adjust for full screen */}
      <div className="flex-1 overflow-hidden px-4 pb-4">
        {currentView === 'class' ? (
          <div className="w-full h-full flex">
            {/* Class Activities Sidebar */}
            <motion.div 
              className="flex-shrink-0 border-r bg-muted/20 h-full flex flex-col overflow-hidden"
              initial={{ width: 280 }}
              animate={{ width: isClassActivitiesSidebarOpen ? 280 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {isClassActivitiesSidebarOpen && (
                <div className="w-[280px] h-full flex flex-col">
                  <div className="p-3 border-b bg-muted/40">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        Class Activities
                        <Badge variant="outline" className="h-5 bg-primary/10 text-primary border-primary/20">
                          {activities['meta-activities']?.length || 0}
                        </Badge>
                      </h3>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={selectAllMetaActivities}
                          disabled={Object.values(isLoadingAssignments).some(loading => loading)}
                        >
                          {activities['meta-activities']?.length > 0 && 
                           selectedMetaActivities.size === activities['meta-activities']?.length ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          <span className="sr-only">Select All</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setIsClassActivitiesSidebarOpen(false)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="sr-only">Collapse sidebar</span>
                        </Button>
                      </div>
                    </div>
                    
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
                  
                  <div className="flex-1 overflow-y-auto p-2">
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
                          />
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Main Board Area */}
            <div className={`flex-1 overflow-x-auto relative ${!isClassActivitiesSidebarOpen ? 'pl-10' : ''}`}>
              {/* Expand button - only show when sidebar is collapsed */}
              {!isClassActivitiesSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-sm border"
                  onClick={() => setIsClassActivitiesSidebarOpen(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Expand sidebar</span>
                </Button>
              )}
              
              <div className="flex h-full">
                {/* Columns */}
                <div className="flex gap-4 p-4 h-full">
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
                      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-180px)]">
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
                              
                              {/* Loading indicator for when assignments are being fetched */}
                              {selectedMetaActivities.size > 0 && 
                               Object.values(isLoadingAssignments).some(loading => loading) && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex justify-center items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                                    <span>Loading assignments...</span>
                                  </div>
                                </motion.div>
                              )}
                              
                              {/* Empty state for no assignments in a column - only show when not loading */}
                              {getColumnAssignments(column.id).length === 0 && 
                               selectedMetaActivities.size > 0 && 
                               !Object.values(isLoadingAssignments).some(loading => loading) && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md"
                                >
                                  <span>No assignments in {column.name}</span>
                                  <span className="text-xs mt-1">Drag assignments here</span>
                                </motion.div>
                              )}
                              
                              {/* Message to select meta activities - only show when not loading */}
                              {selectedMetaActivities.size === 0 && 
                               !Object.values(isLoadingAssignments).some(loading => loading) && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md"
                                >
                                  <span className="mb-1">← Select class activities</span>
                                  <span className="text-xs">to view student assignments</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
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
                  <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-180px)]">
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
  );
}