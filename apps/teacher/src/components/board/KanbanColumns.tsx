"use client";

import { useState } from 'react';
import { Column } from '@/utils/types';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@intellect-kanban/ui';
import { PlusIcon } from 'lucide-react';
import { CreateColumnDialog } from './CreateColumnDialog';

interface KanbanColumnsProps {
  columns: Column[];
  boardId: string;
  activities: Record<string, any[]>; // Column ID to array of activities
  draggingFrom: string | null;
  onDragStart: (activityId: string, columnId: string) => void;
  onDragEnd: () => void;
  onMoveActivity: (activityId: string, fromColumnId: string, toColumnId: string) => void;
  isMetaColumn?: (id: string) => boolean; // Function to check if a column is the meta column
}

export function KanbanColumns({ 
  columns, 
  boardId, 
  activities,
  draggingFrom, 
  onDragStart, 
  onDragEnd,
  onMoveActivity,
  isMetaColumn = () => false
}: KanbanColumnsProps) {
  const [showAddColumn, setShowAddColumn] = useState(false);

  // Sort columns by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  const handleColumnCreated = (newColumn: Column) => {
    // This will be handled by parent component through re-fetching data
    setShowAddColumn(false);
  };

  const handleDropActivity = (activityId: string, fromColumnId: string, toColumnId: string) => {
    // Don't allow moving to a meta column
    if (isMetaColumn(toColumnId)) {
      return;
    }

    onMoveActivity(activityId, fromColumnId, toColumnId);
  };

  return (
    <div className="flex gap-4 h-full">
      {sortedColumns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          activities={activities[column.id] || []}
          isMetaColumn={isMetaColumn(column.id)}
          onDragStart={(activityId) => {
            if (!isMetaColumn(column.id)) {
              onDragStart(activityId, column.id);
            }
          }}
          onDragEnd={onDragEnd}
          onDropActivity={(activityId, fromColumn) => {
            if (fromColumn && fromColumn !== column.id) {
              handleDropActivity(activityId, fromColumn, column.id);
            }
          }}
          isDragTarget={draggingFrom !== null && draggingFrom !== column.id && !isMetaColumn(column.id)}
        />
      ))}

      {/* Only show Add Column button if not in editing mode */}
      {!showAddColumn && (
        <div className="flex-shrink-0 w-[280px] h-full">
          <button 
            className="h-full w-full rounded-md border-2 border-dashed border-muted-foreground/20 flex items-center justify-center hover:bg-muted/50 transition-colors"
            onClick={() => setShowAddColumn(true)}
          >
            <div className="flex flex-col items-center text-muted-foreground">
              <PlusIcon className="h-6 w-6 mb-1" />
              <span className="text-sm font-medium">Add Column</span>
            </div>
          </button>
        </div>
      )}

      {/* Column creation dialog */}
      {showAddColumn && (
        <CreateColumnDialog
          boardId={boardId}
          onClose={() => setShowAddColumn(false)}
          onColumnCreated={handleColumnCreated}
          initialOrder={sortedColumns.length}
        />
      )}
    </div>
  );
} 