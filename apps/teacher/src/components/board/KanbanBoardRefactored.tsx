"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Board, Activity as ActivityType, StudentOption } from '@/utils/types';
import { Assignment } from '@/utils/types/assignment';
import { BoardHeader } from './BoardHeader';
import { ActivityDetailDialog } from './ActivityDetailDialog';
import { CreateActivityDialog } from './CreateActivityDialog';
import { ManageStudentsDialog } from './ManageStudentsDialog';
import { TagsProvider } from '@/contexts/TagsContext';
import { SocketProvider, useSocketContext } from '@/contexts/SocketContext';
import { PersonalViewBoard } from './kanban/PersonalViewBoard';
import { ClassViewBoard } from './kanban/ClassViewBoard';
import { Skeleton } from '@intellect-kanban/ui';
import { DifficultyLevel, difficultyLevelLabels, difficultyLevelColors } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';
import { MetaActivityDetailDialog } from './MetaActivityDetailDialog';

// Make sure we're using a consistent type for Activity with tags and difficultyLevel
type ExtendedActivity = ActivityType & {
  tags?: any[];
  difficultyLevel?: DifficultyLevel;
};

interface KanbanBoardProps {
  boardId: string;
}

export function KanbanBoardRefactored({ boardId }: KanbanBoardProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  
  const [draggingActivity, setDraggingActivity] = useState<string | null>(null);
  const [draggingFromColumn, setDraggingFromColumn] = useState<string | null>(null);

  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [preSelectedColumn, setPreSelectedColumn] = useState<string | null>(null);

  const [activities, setActivities] = useState<Record<string, ExtendedActivity[]>>({});
  const [currentView, setCurrentView] = useState<'personal' | 'class'>('personal');

  const [selectedMetaActivities, setSelectedMetaActivities] = useState<Set<string>>(new Set());
  const [assignmentsByActivity, setAssignmentsByActivity] = useState<Record<string, Assignment[]>>({});
  const [isLoadingAssignments, setIsLoadingAssignments] = useState<Record<string, boolean>>({});

  const [metaActivitySearchQuery, setMetaActivitySearchQuery] = useState('');
  const [selectedStudentFilters, setSelectedStudentFilters] = useState<Set<string>>(new Set());
  const [tempStudentFilters, setTempStudentFilters] = useState<Set<string>>(new Set());
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const [tempTagFilters, setTempTagFilters] = useState<Set<string>>(new Set());
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [selectedDifficultyFilters, setSelectedDifficultyFilters] = useState<Set<DifficultyLevel>>(new Set());
  const [tempDifficultyFilters, setTempDifficultyFilters] = useState<Set<DifficultyLevel>>(new Set());
  
  const [activeFilterTab, setActiveFilterTab] = useState<'students' | 'tags' | 'difficulty' | 'activities'>('students');
  
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isStudentFilterOpen, setIsStudentFilterOpen] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<string>('');

  const [isMetaActivityDetailOpen, setIsMetaActivityDetailOpen] = useState(false);
  const [detailMetaActivity, setDetailMetaActivity] = useState<ExtendedActivity | null>(null);

  const { assignmentUpdates } = useSocketContext();

  useEffect(() => {
    if (assignmentUpdates.length > 0 && board) {
      const latestUpdate = assignmentUpdates[0];
      if (latestUpdate && latestUpdate.assignment) {
        const updatedAssignment = latestUpdate.assignment;
        setAssignmentsByActivity(prev => {
          const activityId = typeof updatedAssignment.activityId === 'object' 
            ? updatedAssignment.activityId._id 
            : updatedAssignment.activityId;
            
          if (!activityId) return prev;
          const currentAssignments = [...(prev[activityId] || [])];
          const existingIndex = currentAssignments.findIndex(a => a._id === updatedAssignment._id);
          
          if (existingIndex >= 0) {
            currentAssignments[existingIndex] = updatedAssignment;
          } else {
            currentAssignments.push(updatedAssignment);
          }
          return { ...prev, [activityId]: currentAssignments };
        });
      }
    }
  }, [assignmentUpdates, board]);

  const fetchActivitiesCallback = useCallback(async (currentBoardId: string) => {
    try {
      setIsLoadingActivities(true);
      const response = await fetch(`/api/board/${currentBoardId}/activities`);
      if (!response.ok) throw new Error(`Failed to load activities: ${response.status}`);
      const activitiesData = await response.json();
      if (!Array.isArray(activitiesData)) {
        toast.error('Invalid activities data format');
        return;
      }

      const groupedActivities: Record<string, ExtendedActivity[]> = {};
      board?.columns?.forEach(column => { groupedActivities[column.id] = []; });
      groupedActivities['meta-activities'] = []; // Ensure meta-activities column exists

      activitiesData.forEach((activity: ExtendedActivity) => {
        if (!activity._id) return;
        const columnId = activity.columnId || (board?.columns && board.columns.length > 0 ? board.columns[0].id : undefined);
        if (columnId && groupedActivities[columnId]) {
          groupedActivities[columnId].push(activity);
        } else if (columnId) {
          groupedActivities[columnId] = [activity];
        }

        if (activity.type === 'meta') {
          groupedActivities['meta-activities'].push(activity);
        }
      });
      setActivities(groupedActivities);
    } catch (err) {
      toast.error('Failed to load activities', { description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setIsLoadingActivities(false);
    }
  }, [board]); // board dependency is important here

  useEffect(() => {
    if (board && board._id) {
      fetchActivitiesCallback(board._id);
    }
  }, [board, fetchActivitiesCallback]);

  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/board/${boardId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load board data');
        }
        const boardData = await response.json();
        setBoard(boardData);
        if (boardData.students) setStudents(boardData.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to load board', { description: err instanceof Error ? err.message : 'Please try again' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBoardData();
  }, [boardId]);

  const handleActivityCreated = (newActivity: ExtendedActivity) => {
    if (newActivity?.columnId) {
      const columnId = newActivity.columnId;
      setActivities(prev => {
        const updated = { ...prev };
        if (!updated[columnId]) updated[columnId] = [];
        updated[columnId] = [...updated[columnId], newActivity];
        if (newActivity.type === 'meta') {
          if (!updated['meta-activities']) updated['meta-activities'] = [];
          updated['meta-activities'] = [...updated['meta-activities'], newActivity];
        }
        return updated;
      });
      toast.success('Activity created successfully');
    } else if (board?.columns && board.columns.length > 0) {
      const firstColumnId = board.columns[0].id;
      setActivities(prev => {
        const updated = { ...prev };
        if (!updated[firstColumnId]) updated[firstColumnId] = [];
        updated[firstColumnId] = [...updated[firstColumnId], {...newActivity, columnId: firstColumnId}];
        if (newActivity.type === 'meta') {
           if (!updated['meta-activities']) updated['meta-activities'] = [];
          updated['meta-activities'] = [...updated['meta-activities'], {...newActivity, columnId: firstColumnId}];
        }
        return updated;
      });
      toast.success('Activity created successfully');
    }
  };

  const handleOpenActivityDetail = (activity: ExtendedActivity) => {
    setSelectedActivity(activity);
    setIsActivityDetailOpen(true);
  };

  const handleDragStart = (activityId: string, columnId: string) => {
    if (columnId === 'meta-activities') return;
    setDraggingActivity(activityId);
    setDraggingFromColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (columnId === 'meta-activities') {
        e.preventDefault();
        return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (targetColumnId === 'meta-activities') return;
    if (!draggingActivity || !draggingFromColumn || draggingFromColumn === targetColumnId) return;

    const activityToMove = activities[draggingFromColumn]?.find(act => act._id === draggingActivity);
    if (!activityToMove || activityToMove.type === 'meta') {
      if (activityToMove?.type === 'meta') toast.error("Class activities can't be moved.");
      return;
    }

    const originalActivities = { ...activities }; // Save original state for optimistic update reversal
    
    // Optimistic UI update
    setActivities(prev => {
      const updated = { ...prev };
      updated[draggingFromColumn] = prev[draggingFromColumn].filter(act => act._id !== draggingActivity);
      if (!updated[targetColumnId]) updated[targetColumnId] = [];
      updated[targetColumnId] = [...updated[targetColumnId], { ...activityToMove, columnId: targetColumnId }];
      return updated;
    });

    setDraggingActivity(null);
    setDraggingFromColumn(null);

    const toastId = toast.loading('Updating activity...');
    try {
      const response = await fetch(`/api/board/${boardId}/activities/${draggingActivity}/column`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnId: targetColumnId }),
      });
      if (!response.ok) throw new Error('Failed to update activity column');
      toast.success('Activity moved successfully', { id: toastId });
      // Optionally re-fetch activities or update specific activity if backend returns updated data
      // For now, optimistic update is primary, consider re-fetch if sync issues arise
    } catch (error) {
      console.error('Error updating activity column:', error);
      toast.error('Failed to update activity', { id: toastId });
      setActivities(originalActivities); // Revert UI on error
    }
  };
  
  const handleViewChange = (view: 'personal' | 'class') => setCurrentView(view);

  const toggleMetaActivitySelection = async (activityId: string) => {
    const newSelection = new Set(selectedMetaActivities);
    if (newSelection.has(activityId)) {
      newSelection.delete(activityId);
      setAssignmentsByActivity(prev => { const updated = { ...prev }; delete updated[activityId]; return updated; });
    } else {
      newSelection.add(activityId);
      setIsLoadingAssignments(prev => ({ ...prev, [activityId]: true }));
      try {
        const response = await fetch(`/api/assignments/activity/${activityId}`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        const assignmentsData = await response.json();
        setAssignmentsByActivity(prev => ({ ...prev, [activityId]: assignmentsData }));
      } catch (error) {
        toast.error('Failed to load assignments');
        newSelection.delete(activityId); // Revert selection on error
      } finally {
        setIsLoadingAssignments(prev => ({ ...prev, [activityId]: false }));
      }
    }
    setSelectedMetaActivities(newSelection);
  };

  const selectAllMetaActivities = async () => {
    if (Object.values(isLoadingAssignments).some(loading => loading)) return;
    const metaActs = activities['meta-activities'] || [];
    if (metaActs.length > 0 && selectedMetaActivities.size === metaActs.length) {
      setSelectedMetaActivities(new Set());
      setAssignmentsByActivity({});
      return;
    }

    const newSelection = new Set<string>(metaActs.map(act => act._id));
    setSelectedMetaActivities(newSelection);

    const activityIdsToLoad = metaActs.filter(act => !assignmentsByActivity[act._id]).map(act => act._id);
    if (activityIdsToLoad.length === 0) return;

    setIsLoadingAssignments(prev => ({ ...prev, ...activityIdsToLoad.reduce((acc, id) => ({...acc, [id]: true}), {}) }));
    try {
      const results = await Promise.all(activityIdsToLoad.map(async id => {
        const res = await fetch(`/api/assignments/activity/${id}`);
        if (!res.ok) throw new Error(`Failed for ${id}`);
        return { activityId: id, assignments: await res.json() };
      }));
      setAssignmentsByActivity(prev => ({ ...prev, ...results.reduce((acc, {activityId, assignments}) => ({...acc, [activityId]: assignments}), {}) }));
    } catch (error) {
      toast.error('Failed to load some assignments');
    } finally {
      setIsLoadingAssignments(prev => ({ ...prev, ...activityIdsToLoad.reduce((acc, id) => ({...acc, [id]: false}), {}) }));
    }
  };

  const handleManageStudents = (activity: ExtendedActivity) => {
    setSelectedActivity(activity);
    setIsManageStudentsOpen(true);
  };
  
  const handleStudentsUpdated = async () => {
    if (board && board._id) {
      await fetchActivitiesCallback(board._id);
      const currentlySelectedActivities = Array.from(selectedMetaActivities);
      if (currentlySelectedActivities.length > 0) {
        setIsLoadingAssignments(prev => ({ ...prev, ...currentlySelectedActivities.reduce((acc, id) => ({...acc, [id]: true}), {}) }));
        try {
          const results = await Promise.all(currentlySelectedActivities.map(async id => {
            const res = await fetch(`/api/assignments/activity/${id}`);
            if (!res.ok) throw new Error(`Failed for ${id}`);
            return { activityId: id, assignments: await res.json() };
          }));
          setAssignmentsByActivity(prev => ({ ...prev, ...results.reduce((acc, {activityId, assignments}) => ({...acc, [activityId]: assignments}), {}) }));
        } catch (error) {
          toast.error('Failed to refresh some assignments');
        } finally {
          setIsLoadingAssignments(prev => ({ ...prev, ...currentlySelectedActivities.reduce((acc, id) => ({...acc, [id]: false}), {}) }));
        }
      }
    }
  };

  const getAllColumnAssignments = useCallback((columnId: string): Assignment[] => {
    if (currentView !== 'class' || columnId === 'meta-activities') return [];
    const assignments: Assignment[] = [];
    selectedMetaActivities.forEach(activityId => {
      const activityAssignments = assignmentsByActivity[activityId] || [];
      assignments.push(...activityAssignments.filter(a => a.columnId === columnId));
    });
    return assignments;
  }, [currentView, selectedMetaActivities, assignmentsByActivity]);

  const getColumnAssignments = useCallback((columnId: string): Assignment[] => {
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
        const activity = activities['meta-activities']?.find(act => act._id === activityId) as ExtendedActivity;
        return activity && Array.isArray(activity.tags) && activity.tags.some((tag: any) => selectedTagFilters.has(typeof tag === 'object' ? tag._id : tag));
      });
    }
    if (selectedDifficultyFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(a => {
        const activityId = typeof a.activityId === 'object' ? a.activityId._id : a.activityId;
        const activity = activities['meta-activities']?.find(act => act._id === activityId) as ExtendedActivity;
        return activity && activity.difficultyLevel ? selectedDifficultyFilters.has(activity.difficultyLevel) : false;
      });
    }
    return filteredAssignments;
  }, [currentView, getAllColumnAssignments, selectedStudentFilters, selectedTagFilters, selectedDifficultyFilters, activities]);

  const getUniqueStudentsFromSelectedActivities = useCallback((): { _id: string; name: string }[] => {
    const uniqueStudentsMap = new Map<string, { _id: string; name: string }>();
    selectedMetaActivities.forEach(activityId => {
      (assignmentsByActivity[activityId] || []).forEach(assignment => {
        if (typeof assignment.studentId === 'object' && assignment.studentId?._id) {
          uniqueStudentsMap.set(assignment.studentId._id, { _id: assignment.studentId._id, name: assignment.studentId.name || 'Unnamed' });
        }
      });
    });
    return Array.from(uniqueStudentsMap.values());
  }, [selectedMetaActivities, assignmentsByActivity]);

  const getUniqueTagsFromSelectedActivities = useCallback((): TagType[] => {
    const uniqueTagsMap = new Map<string, TagType>();
    selectedMetaActivities.forEach(activityId => {
      const activity = activities['meta-activities']?.find(act => act._id === activityId) as ExtendedActivity;
      (activity?.tags as any[])?.forEach(tag => {
        const tagId = typeof tag === 'object' ? tag._id : String(tag);
        if (tagId && !uniqueTagsMap.has(tagId)) {
          uniqueTagsMap.set(tagId, typeof tag === 'object' ? tag : { _id: tagId, name: 'Unknown', color: '#ccc' } as TagType);
        }
      });
    });
    return Array.from(uniqueTagsMap.values());
  }, [selectedMetaActivities, activities]);

  const getUniqueDifficultyLevelsFromSelectedActivities = useCallback((): { level: DifficultyLevel, label: string, color: string }[] => {
    const uniqueLevels = new Set<DifficultyLevel>();
    selectedMetaActivities.forEach(activityId => {
      const activity = activities['meta-activities']?.find(act => act._id === activityId) as ExtendedActivity;
      if (activity?.difficultyLevel) uniqueLevels.add(activity.difficultyLevel);
    });
    return Array.from(uniqueLevels).map(level => ({
      level,
      label: difficultyLevelLabels[level] || 'Unknown',
      color: difficultyLevelColors[level] || '#ccc'
    }));
  }, [selectedMetaActivities, activities]);

  const handleActivityDeleted = (activityId: string) => {
    setActivities(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(colId => { updated[colId] = updated[colId].filter(act => act._id !== activityId); });
      return updated;
    });
    setSelectedActivity(null);
    setDeletingActivityId('');
  };

  const areAllAssignmentsLoading = useCallback(() => Object.values(isLoadingAssignments).some(loading => loading), [isLoadingAssignments]);
  const mightHaveAssignmentsLoading = useCallback((columnId: string) => getColumnAssignments(columnId).length === 0 && areAllAssignmentsLoading(), [getColumnAssignments, areAllAssignmentsLoading]);

  const handleAddActivityToColumn = (columnId: string) => {
    setPreSelectedColumn(columnId);
    setIsCreateActivityOpen(true);
  };

  const handleViewMetaActivityDetails = (activity: ExtendedActivity) => {
    setDetailMetaActivity(activity);
    setIsMetaActivityDetailOpen(true);
  };

  const handleMetaActivityDetailManageStudents = (activity: ExtendedActivity) => {
    setIsMetaActivityDetailOpen(false);
    setTimeout(() => handleManageStudents(activity as any), 200);
  };

  if (isLoading) {
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

  if (error || !board) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-lg font-medium text-red-800">Failed to load board</h2>
        <p className="mt-1 text-red-700">{error || 'Board not found'}</p>
      </div>
    );
  }

  return (
    <SocketProvider boardId={boardId}>
      <TagsProvider boardId={boardId}>
        <div className="flex flex-col h-screen">
            <BoardHeader 
                board={board} 
                onActivityButtonClick={() => setIsCreateActivityOpen(true)}
                onViewChange={handleViewChange}
                currentView={currentView}
            />

          <div className="flex-1 overflow-hidden px-4 pb-8">
            {currentView === 'personal' ? (
              <PersonalViewBoard 
                columns={board.columns}
                activities={activities}
                isLoadingActivities={isLoadingActivities}
                draggingActivity={draggingActivity}
                draggingFromColumn={draggingFromColumn}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleOpenActivityDetail={handleOpenActivityDetail}
                deletingActivityId={deletingActivityId}
                onAddActivity={handleAddActivityToColumn}
              />
            ) : (
              <ClassViewBoard 
                columns={board.columns}
                activities={activities} // Pass all activities for meta-activity lookup
                isLoadingActivities={isLoadingActivities}
                draggingActivity={draggingActivity}
                draggingFromColumn={draggingFromColumn}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleOpenActivityDetail={handleOpenActivityDetail}
                deletingActivityId={deletingActivityId}
                metaActivities={activities['meta-activities'] || []}
                selectedMetaActivities={selectedMetaActivities}
                isLoadingAssignments={isLoadingAssignments}
                toggleMetaActivitySelection={toggleMetaActivitySelection}
                selectAllMetaActivities={selectAllMetaActivities}
                handleManageStudents={handleManageStudents}
                handleViewMetaActivityDetails={handleViewMetaActivityDetails}
                searchQuery={metaActivitySearchQuery}
                setSearchQuery={setMetaActivitySearchQuery}
                getColumnAssignments={getColumnAssignments}
                getAllColumnAssignments={getAllColumnAssignments}
                areAllAssignmentsLoading={areAllAssignmentsLoading}
                mightHaveAssignmentsLoading={mightHaveAssignmentsLoading}
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
                uniqueStudents={getUniqueStudentsFromSelectedActivities()}
                uniqueTags={getUniqueTagsFromSelectedActivities()}
                uniqueDifficultyLevels={getUniqueDifficultyLevelsFromSelectedActivities()}
              />
            )}
          </div>

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

          <CreateActivityDialog
            isOpen={isCreateActivityOpen}
            onOpenChange={(open) => {
              setIsCreateActivityOpen(open);
              if (!open) setPreSelectedColumn(null);
            }}
            boardId={boardId}
            columns={board?.columns || []}
            students={students as any[]}
            onActivityCreated={handleActivityCreated}
            showMetaOption={true}
            initialColumnId={preSelectedColumn}
          />

          <ManageStudentsDialog
            isOpen={isManageStudentsOpen}
            onOpenChange={setIsManageStudentsOpen}
            activity={selectedActivity}
            classStudents={students}
            onStudentsUpdated={handleStudentsUpdated}
          />

          {/* Meta Activity Detail Dialog */}
          <MetaActivityDetailDialog
            isOpen={isMetaActivityDetailOpen}
            onOpenChange={setIsMetaActivityDetailOpen}
            activity={detailMetaActivity}
            onManageStudents={(activity) => handleMetaActivityDetailManageStudents(activity as any)}
            onActivityDeleted={handleActivityDeleted}
            onDeletePending={setDeletingActivityId}
            classStudents={students}
          />
        </div>
      </TagsProvider>
    </SocketProvider>
  );
} 