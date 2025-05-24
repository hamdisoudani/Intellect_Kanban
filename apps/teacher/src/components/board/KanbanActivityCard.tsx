"use client";

import { Card, CardContent, Avatar, Badge, AvatarFallback } from '@intellect-kanban/ui';
import { PriorityBadge } from './PriorityBadge';
import { useMemo } from 'react';
import { CalendarIcon, Users } from 'lucide-react';

interface KanbanActivityCardProps {
  activity: any;
  columnId?: string;
  isMetaActivity?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, activity: any) => void;
  onDragEnd?: () => void;
  onClick?: (activity: any) => void;
}

export function KanbanActivityCard({ 
  activity, 
  columnId,
  isMetaActivity = false,
  onDragStart, 
  onDragEnd,
  onClick
}: KanbanActivityCardProps) {
  // Format the date for display if available
  const formattedDate = useMemo(() => {
    if (!activity.dueDate) return null;
    
    try {
      const date = new Date(activity.dueDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Invalid date format:', activity.dueDate);
      return null;
    }
  }, [activity.dueDate]);

  // Determine if the activity is assignmed
  const hasAssignment = activity.assignedTo || (activity.assignedStudents && activity.assignedStudents.length > 0);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isMetaActivity) {
      // Prevent dragging for meta activities
      e.preventDefault();
      return;
    }
    
    // Call the parent's onDragStart handler if provided
    if (onDragStart) {
      onDragStart(e, activity);
    }
  };

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // Card click handler
  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  // Special styles for meta activities
  const metaCardStyle = isMetaActivity 
    ? "border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800/30" 
    : "";

  return (
    <Card 
      className={`cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all ${metaCardStyle}`}
      draggable={!isMetaActivity}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
    >
      <CardContent className="p-1.5">
        <div className="space-y-1">
          {/* Title */}
          <div className="font-medium text-xs line-clamp-2 break-words">
            {activity.title}
          </div>
          
          {/* Meta information */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Activity type indicator */}
              {isMetaActivity && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                  <Users className="h-2 w-2 mr-0.5" /> Class
                </Badge>
              )}
              
              {/* Due date */}
              {formattedDate && (
                <div className="flex items-center">
                  <CalendarIcon className="h-2 w-2 mr-0.5" />
                  <span>{formattedDate}</span>
                </div>
              )}
            </div>
            
            {/* Priority */}
            {activity.priority && (
              <PriorityBadge priority={activity.priority} />
            )}
          </div>
          
          {/* Assignment information */}
          {hasAssignment && (
            <div className="pt-0.5 flex items-center gap-1">
              <Avatar className="h-3.5 w-3.5">
                <AvatarFallback className="text-[8px]">
                  {activity.assignedTo?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] truncate">
                {activity.assignedTo || `${activity.assignedStudents?.length || 0} students`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 