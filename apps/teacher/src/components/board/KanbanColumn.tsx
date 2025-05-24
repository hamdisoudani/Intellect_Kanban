"use client";

import { useState } from 'react';
import { Column } from '@/utils/types';
import { KanbanActivityCard } from './KanbanActivityCard';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button
} from '@intellect-kanban/ui';
import { MoreHorizontalIcon, PlusIcon, PenIcon, TrashIcon, Info } from 'lucide-react';

// Activity type definition
interface Activity {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: string;
  priority: string;
}

interface KanbanColumnProps {
  column: Column;
  activities: Activity[];
  isDragTarget: boolean;
  isMetaColumn?: boolean;
  onDragStart: (activityId: string, columnId: string) => void;
  onDragEnd: () => void;
  onDropActivity: (activityId: string, fromColumn: string) => void;
}

export function KanbanColumn({ 
  column, 
  activities, 
  isDragTarget,
  isMetaColumn = false,
  onDragStart,
  onDragEnd,
  onDropActivity
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  
  // Handle drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isOver) {
      setIsOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    
    // Get activity data from drag event
    const activityId = e.dataTransfer.getData('activityId');
    const fromColumn = e.dataTransfer.getData('fromColumn');
    
    if (activityId && fromColumn) {
      onDropActivity(activityId, fromColumn);
    }
  };

  // Special styles for meta column
  const metaColumnStyle = isMetaColumn 
    ? "bg-muted/30 border-muted-foreground/20" 
    : "";

  // Combine drag handlers - only apply to non-meta columns
  const dragHandlers = (!isMetaColumn && isDragTarget) ? {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  } : {};

  return (
    <div 
      className={`flex-shrink-0 w-[280px] h-full ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
      {...dragHandlers}
    >
      <Card className={`h-full flex flex-col ${metaColumnStyle}`}>
        <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 border-b">
          <div className="flex items-center gap-2">
            {isMetaColumn && <Info size={16} className="text-muted-foreground" />}
            <CardTitle className="text-sm font-medium">{column.name}</CardTitle>
            <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
              {activities.length}
            </Badge>
          </div>
          
          {/* Only show dropdown menu for regular columns */}
          {!isMetaColumn && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontalIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Column actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Activity
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PenIcon className="mr-2 h-4 w-4" />
                  Edit Column
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className="p-2 flex-grow overflow-y-auto">
          <div className="space-y-2">
            {activities.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-sm text-muted-foreground p-3">
                <div className="text-center mb-1">
                  {isMetaColumn ? 'No class activities' : 'No activities'}
                </div>
                {!isMetaColumn && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            ) : (
              activities.map((activity) => (
                <KanbanActivityCard
                  key={activity._id || activity.id}
                  activity={activity}
                  columnId={column.id}
                  onDragStart={(e, act) => {
                    // Only allow dragging from non-meta columns
                    if (!isMetaColumn) {
                      // Set the data to be transferred
                      e.dataTransfer.setData('activityId', act._id || act.id);
                      e.dataTransfer.setData('fromColumn', column.id);
                      e.dataTransfer.effectAllowed = 'move';
                      
                      onDragStart(act._id || act.id, column.id);
                    }
                  }}
                  onDragEnd={onDragEnd}
                  isMetaActivity={isMetaColumn}
                />
              ))
            )}
          </div>
        </CardContent>
        
        {/* Only show add activity button for regular columns with activities */}
        {!isMetaColumn && activities.length > 0 && (
          <div className="p-1.5 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-xs text-muted-foreground h-7"
            >
              <PlusIcon className="mr-1.5 h-3 w-3" />
              Add Activity
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
} 