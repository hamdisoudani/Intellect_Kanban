"use client";

import { KanbanRegularColumn } from './KanbanRegularColumn';

interface PersonalViewBoardProps {
  columns: Array<{ id: string; name: string; order?: number }>;
  activities: Record<string, any[]>;
  isLoadingActivities: boolean;
  draggingActivity: string | null;
  draggingFromColumn: string | null;
  handleDragStart: (activityId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenActivityDetail: (activity: any) => void;
  deletingActivityId: string;
  onAddActivity: (columnId: string) => void;
}

export function PersonalViewBoard({
  columns,
  activities,
  isLoadingActivities,
  draggingActivity,
  draggingFromColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenActivityDetail,
  deletingActivityId,
  onAddActivity
}: PersonalViewBoardProps) {
  // Get personal activities for a column
  const getPersonalActivities = (columnId: string) => {
    if (!activities[columnId]) {
      return [];
    }
    
    // In personal view, show only personal activities
    return activities[columnId].filter(act => act.type === 'personal');
  };
  
  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max pb-4">
        {columns.map((column) => (
          <KanbanRegularColumn
            key={column.id}
            column={column}
            currentView="personal"
            activities={getPersonalActivities(column.id)}
            assignments={[]}
            allAssignments={[]}
            isLoadingActivities={isLoadingActivities}
            areAssignmentsLoading={false}
            draggingActivity={draggingActivity}
            draggingFromColumn={draggingFromColumn}
            selectedMetaActivities={new Set()}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleOpenActivityDetail={handleOpenActivityDetail}
            deletingActivityId={deletingActivityId}
            onAddActivity={onAddActivity}
            
            // Empty filter props since they're not used in personal view
            selectedStudentFilters={new Set()}
            selectedTagFilters={new Set()}
            selectedDifficultyFilters={new Set()}
            clearAllFilters={() => {}}
          />
        ))}
      </div>
    </div>
  );
} 