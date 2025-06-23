"use client";

import { useEffect } from 'react';
import { BoardHeader } from './BoardHeader';
import { ActivityDetailDialog } from './ActivityDetailDialog';
import { CreateActivityDialog } from './CreateActivityDialog';
import { ManageStudentsDialog } from './ManageStudentsDialog';
import { TagsProvider } from '@/contexts/TagsContext';
import { PersonalViewBoard } from './kanban/PersonalViewBoard';
import { ClassViewBoard } from './kanban/ClassViewBoard';
import { Skeleton } from '@intellect-kanban/ui';
import { MetaActivityDetailDialog } from './MetaActivityDetailDialog';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@intellect-kanban/ui';
import { Button } from '@intellect-kanban/ui';
import { AlertCircle, ArrowLeftIcon, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import stores
import { 
  useBoardStore, 
  useActivitiesStore, 
  useAssignmentsStore, 
  useDragDropStore, 
  useFiltersStore,
  useSocketStore
} from '@/store';

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoardRefactored({ boardId }: KanbanBoardProps) {
  // Get session for authentication
  const session = useSession();
  // Add router at the top level
  const router = useRouter();
  
  // Use stores instead of local state
  const { 
    board, 
    isLoading, 
    error, 
    students, 
    currentView,
    fetchBoard,
    setCurrentView 
  } = useBoardStore();
  
  const {
    activities,
    metaActivities,
    isLoading: isLoadingActivities,
    selectedActivity,
    isActivityDetailOpen,
    isCreateActivityOpen,
    preSelectedColumn,
    deletingActivityId,
    isMetaActivityDetailOpen,
    detailMetaActivity,
    selectedMetaActivities,
    metaActivitySearchQuery,
    fetchActivities,
    openActivityDetail,
    closeActivityDetail,
    openCreateActivity,
    closeCreateActivity,
    setDeletingActivityId,
    openMetaActivityDetail,
    closeMetaActivityDetail,
    toggleMetaActivitySelection,
    selectAllMetaActivities,
    setMetaActivitySearchQuery,
    createActivity,
    deleteActivity
  } = useActivitiesStore();
  
  const {
    assignmentsByActivity,
    isLoadingAssignments,
    isManageStudentsOpen,
    fetchAssignmentsForActivity,
    openManageStudents,
    closeManageStudents,
    fetchAssignmentsForNewActivities
  } = useAssignmentsStore();
  
  const {
    draggingActivity,
    draggingFromColumn,
    startDrag,
    handleDrop
  } = useDragDropStore();
  
  const {
    selectedStudentFilters,
    tempStudentFilters,
    studentSearchQuery,
    isStudentFilterOpen,
    selectedTagFilters,
    tempTagFilters,
    tagSearchQuery,
    selectedDifficultyFilters,
    tempDifficultyFilters,
    activeFilterTab,
    setSelectedStudentFilters,
    setTempStudentFilters,
    setStudentSearchQuery,
    setIsStudentFilterOpen,
    setSelectedTagFilters,
    setTempTagFilters,
    setTagSearchQuery,
    setSelectedDifficultyFilters,
    setTempDifficultyFilters,
    setActiveFilterTab
  } = useFiltersStore();
  
  const {
    connectToBoard
  } = useSocketStore();

  // Fetch board data on component mount
  useEffect(() => {
    // Only fetch the board when the session is authenticated
    if (session.status === "authenticated") {
      fetchBoard(boardId);
    }
  }, [boardId, fetchBoard, session.status]);

  // Fetch activities when board data is loaded
  useEffect(() => {
    if (board && board._id) {
      fetchActivities(board._id);
    }
  }, [board, fetchActivities]);
  
  // Connect to WebSocket when board data is loaded and user is authenticated
  useEffect(() => {
    if (board && session.status === "authenticated" && session.data?.user?.accessToken) {
      connectToBoard(board._id, session.data.user.accessToken);
    }
  }, [board, session, connectToBoard]);

  // Fetch assignments for selected meta activities
  useEffect(() => {
    if (!board || !board._id) return;
    
    // Use the new method that only fetches assignments for new activities
    fetchAssignmentsForNewActivities(board._id, Array.from(selectedMetaActivities));
  }, [board, selectedMetaActivities, fetchAssignmentsForNewActivities]);

  // Helper functions for column assignments
  const getAllColumnAssignments = (columnId: string): any[] => {
    if (currentView !== 'class' || columnId === 'meta-activities') return [];
    const assignments: any[] = [];
    selectedMetaActivities.forEach(activityId => {
      const activityAssignments = assignmentsByActivity[activityId] || [];
      assignments.push(...activityAssignments.filter(a => a.columnId === columnId));
    });
    return assignments;
  };

  const getColumnAssignments = (columnId: string): any[] => {
    if (currentView !== 'class' || columnId === 'meta-activities') return [];
    let filteredAssignments = getAllColumnAssignments(columnId);

    if (selectedStudentFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(a => {
        const studentId = typeof a.studentId === 'object' ? a.studentId._id : a.studentId;
        return selectedStudentFilters.has(studentId as string);
      });
    }
    if (selectedTagFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(a => {
        const activityId = typeof a.activityId === 'object' ? a.activityId._id : a.activityId;
        const activity = metaActivities.find(act => act._id === activityId);
        return activity && Array.isArray(activity.tags) && activity.tags.some((tag: any) => selectedTagFilters.has(typeof tag === 'object' ? tag._id : tag));
      });
    }
    if (selectedDifficultyFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(a => {
        const activityId = typeof a.activityId === 'object' ? a.activityId._id : a.activityId;
        const activity = metaActivities.find(act => act._id === activityId);
        
        // Make sure we have a valid difficulty level and it's in the selected filters
        return activity && activity.difficultyLevel ? 
          selectedDifficultyFilters.has(activity.difficultyLevel) : false;
      });
    }
    return filteredAssignments;
  };

  // Helper functions for filters
  const getUniqueStudentsFromSelectedActivities = (): { _id: string; name: string }[] => {
    const uniqueStudentsMap = new Map<string, { _id: string; name: string }>();
    selectedMetaActivities.forEach(activityId => {
      (assignmentsByActivity[activityId] || []).forEach(assignment => {
        if (typeof assignment.studentId === 'object' && assignment.studentId?._id) {
          uniqueStudentsMap.set(assignment.studentId._id, { _id: assignment.studentId._id, name: assignment.studentId.name || 'Unnamed' });
        }
      });
    });
    return Array.from(uniqueStudentsMap.values());
  };

  const getUniqueTagsFromSelectedActivities = (): any[] => {
    const uniqueTagsMap = new Map<string, any>();
    selectedMetaActivities.forEach(activityId => {
      const activity = metaActivities.find(act => act._id === activityId);
      (activity?.tags as any[])?.forEach(tag => {
        const tagId = typeof tag === 'object' ? tag._id : String(tag);
        if (tagId && !uniqueTagsMap.has(tagId)) {
          uniqueTagsMap.set(tagId, typeof tag === 'object' ? tag : { _id: tagId, name: 'Unknown', color: '#ccc' });
        }
      });
    });
    return Array.from(uniqueTagsMap.values());
  };

  const getUniqueDifficultyLevelsFromSelectedActivities = (): { level: any, label: string, color: string }[] => {
    const { difficultyLevelLabels, difficultyLevelColors } = require('@/types/activities');
    const uniqueLevels = new Set();
    
    // Collect unique difficulty levels from selected activities
    selectedMetaActivities.forEach(activityId => {
      const activity = metaActivities.find(act => act._id === activityId);
      if (activity?.difficultyLevel) uniqueLevels.add(activity.difficultyLevel);
    });
    
    // Convert to array with proper labels and colors
    return Array.from(uniqueLevels).map((level: any) => ({
      level,
      label: difficultyLevelLabels[level] || 'Unknown',
      color: difficultyLevelColors[level] || '#ccc'
    }));
  };

  const areAllAssignmentsLoading = () => Object.values(isLoadingAssignments).some(loading => loading);
  const mightHaveAssignmentsLoading = (columnId: string) => getColumnAssignments(columnId).length === 0 && areAllAssignmentsLoading();

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (columnId === 'meta-activities') {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAddActivityToColumn = (columnId: string) => {
    openCreateActivity(columnId);
  };

  const handleMetaActivityDetailManageStudents = (activity: any) => {
    closeMetaActivityDetail();
    setTimeout(() => openManageStudents(activity), 200);
  };

  const handleActivityDeleted = (activityId: string) => {
    if (board && board._id) {
      deleteActivity(board._id, activityId);
    }
  };

  // Add handleActivityCreated function
  const handleActivityCreated = (newActivity: any) => {
    if (board && board._id) {
      // Update local state instead of creating a new API call
      useActivitiesStore.setState(state => {
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
    }
  };

  // Add handleStudentsUpdated function
  const handleStudentsUpdated = async () => {
    if (board && board._id) {
      // Refresh activities
      await fetchActivities(board._id);
      
      // Use the new method to refresh assignments for selected activities without unnecessary refetching
      fetchAssignmentsForNewActivities(board._id, Array.from(selectedMetaActivities));
    }
  };

  // Check if we're actually loading - either board is loading or session is still loading
  const isActuallyLoading = isLoading || session.status === "loading";

  // Loading state
  if (isActuallyLoading) {
    const columnCount = board?.columns?.length || 4;
    return (
      <div className="flex flex-col h-screen">
        <div className="px-4 py-3 border-b mb-4 bg-background flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-8 w-32 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 pb-8">
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columnCount > 0 ? columnCount : 4} gap-4 h-full auto-rows-max pb-4`}>
            {Array(columnCount > 0 ? columnCount : 4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Add session check for unauthenticated state
  if (session.status === "unauthenticated") {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-lg font-medium text-red-800">Authentication required</h2>
        <p className="mt-1 text-red-700">Please sign in to view this board</p>
      </div>
    );
  }

  // Error state
  if (error || !board) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-full max-w-lg">
          <Alert variant="destructive" className="mb-4 border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Failed to load board</AlertTitle>
            <AlertDescription>
              We couldn't load the board data. This might be due to an expired session.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3 mt-4 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <Button 
              onClick={() => {
                // Clear error and refetch the board
                useBoardStore.setState({ error: null });
                fetchBoard(boardId);
              }}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <TagsProvider boardId={boardId}>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden">
        <BoardHeader 
          board={board} 
          onActivityButtonClick={() => openCreateActivity(null)}
          onViewChange={setCurrentView}
          currentView={currentView}
        />

        <div className="flex-1 overflow-hidden">
          {currentView === 'personal' ? (
            <div className="h-full px-2 sm:px-4 pb-4 sm:pb-6">
              <PersonalViewBoard 
                columns={board.columns}
                items={activities}
                itemType="activity"
                isLoading={isLoadingActivities}
                draggingItem={draggingActivity}
                draggingFromColumn={draggingFromColumn}
                handleDragStart={startDrag}
                handleDragOver={handleDragOver}
                handleDrop={(e: React.DragEvent, columnId: string) => handleDrop(boardId, columnId)}
                handleOpenDetail={openActivityDetail}
                deletingItemId={deletingActivityId}
                onAddItem={handleAddActivityToColumn}
              />
            </div>
          ) : (
            <ClassViewBoard 
              boardId={boardId}
              columns={board.columns}
              draggingItem={draggingActivity}
              draggingFromColumn={draggingFromColumn}
              handleDragStart={startDrag}
              handleDragOver={handleDragOver}
              handleDrop={(e: React.DragEvent, columnId: string) => handleDrop(boardId, columnId)}
              handleOpenDetail={openMetaActivityDetail}
              deletingItemId={deletingActivityId}
              metaActivities={metaActivities}
              selectedMetaActivities={selectedMetaActivities}
              assignments={assignmentsByActivity}
              isLoadingAssignments={isLoadingAssignments}
              isLoadingActivities={isLoadingActivities}
              toggleMetaActivitySelection={toggleMetaActivitySelection}
              selectAllMetaActivities={selectAllMetaActivities}
              onViewDetails={openMetaActivityDetail}
              onManageStudents={openManageStudents}
              metaActivitySearchQuery={metaActivitySearchQuery}
              setMetaActivitySearchQuery={setMetaActivitySearchQuery}
              
              // Filter props
              isStudentFilterOpen={isStudentFilterOpen}
              setIsStudentFilterOpen={setIsStudentFilterOpen}
              selectedStudentFilters={selectedStudentFilters}
              setSelectedStudentFilters={setSelectedStudentFilters}
              tempStudentFilters={tempStudentFilters}
              setTempStudentFilters={setTempStudentFilters}
              selectedTagFilters={selectedTagFilters}
              setSelectedTagFilters={setSelectedTagFilters}
              tempTagFilters={tempTagFilters}
              setTempTagFilters={setTempTagFilters}
              selectedDifficultyFilters={selectedDifficultyFilters}
              setSelectedDifficultyFilters={setSelectedDifficultyFilters}
              tempDifficultyFilters={tempDifficultyFilters}
              setTempDifficultyFilters={setTempDifficultyFilters}
              activeFilterTab={activeFilterTab}
              setActiveFilterTab={setActiveFilterTab}
              studentSearchQuery={studentSearchQuery}
              setStudentSearchQuery={setStudentSearchQuery}
              tagSearchQuery={tagSearchQuery}
              setTagSearchQuery={setTagSearchQuery}
              
              // Data for filters
              uniqueStudents={getUniqueStudentsFromSelectedActivities()}
              uniqueTags={getUniqueTagsFromSelectedActivities()}
              uniqueDifficultyLevels={getUniqueDifficultyLevelsFromSelectedActivities()}
            />
          )}
        </div>

        {selectedActivity && (
          <ActivityDetailDialog 
            isOpen={isActivityDetailOpen} 
            onOpenChange={closeActivityDetail} 
            activity={selectedActivity}
            columns={board?.columns || []}
            students={students}
            onActivityDeleted={handleActivityDeleted}
            onDeletePending={setDeletingActivityId}
          />
        )}

        <CreateActivityDialog
          isOpen={isCreateActivityOpen}
          onOpenChange={(open) => {
            if (!open) closeCreateActivity();
          }}
          boardId={boardId}
          columns={board?.columns || []}
          students={students.map(student => ({ ...student, id: student._id })) as any}
          onActivityCreated={handleActivityCreated}
          showMetaOption={true}
          initialColumnId={preSelectedColumn}
        />

        <ManageStudentsDialog
          isOpen={isManageStudentsOpen}
          onOpenChange={closeManageStudents}
          classStudents={students}
          onStudentsUpdated={handleStudentsUpdated}
        />

        {/* Meta Activity Detail Dialog */}
        <MetaActivityDetailDialog
          isOpen={isMetaActivityDetailOpen}
          onOpenChange={closeMetaActivityDetail}
          activity={detailMetaActivity}
          onManageStudents={handleMetaActivityDetailManageStudents}
          onActivityDeleted={handleActivityDeleted}
          onDeletePending={setDeletingActivityId}
          classStudents={students}
        />
      </div>
    </TagsProvider>
  );
} 