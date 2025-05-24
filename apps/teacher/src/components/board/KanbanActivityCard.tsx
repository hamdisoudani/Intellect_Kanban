"use client";

import { Card, CardContent, Avatar, Badge, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';
import { PriorityBadge } from './PriorityBadge';
import { useMemo } from 'react';
import { CalendarIcon, Users, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import stc from 'string-to-color';

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

  // Calculate time ago string
  const timeAgo = activity.updatedAt 
    ? formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })
    : '';

  // Determine if the activity is assigned
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

  // Generate color from activity ID
  const getBorderColor = () => {
    if (isMetaActivity) {
      return '#6366f1'; // Indigo color for meta activities
    }
    return stc(activity._id || 'default');
  };

  // Get status icon based on column
  const getStatusIcon = () => {
    if (!columnId) return null;
    
    switch (columnId) {
      case 'backlog':
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'doing':
        return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'review':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case 'done':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="mb-3" // Added spacing between cards
    >
      <Card 
        className={`cursor-pointer hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5 transition-all`}
        style={{ borderLeftWidth: '4px', borderLeftColor: getBorderColor() }}
        draggable={!isMetaActivity}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          {/* Title with color indicator */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium line-clamp-1 flex-1 flex items-center gap-1.5">
              <span 
                className="inline-block h-2 w-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getBorderColor() }}
              ></span>
              {activity.title}
            </h4>
            
            {getStatusIcon() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Status: {columnId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Meta information and priority */}
          <div className="flex justify-between items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
            <div className="flex items-center gap-1.5">
              {/* Activity type indicator */}
              {isMetaActivity ? (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                  <Users className="h-2 w-2 mr-0.5" /> Class
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20">
                  Personal
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
          
          {/* Assignment information or created by */}
          <div className="flex items-center justify-between">
            {hasAssignment ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/40 text-primary-foreground">
                    {activity.assignedTo?.substring(0, 2).toUpperCase() || 'ST'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">
                  {activity.assignedTo || `${activity.assignedStudents?.length || 0} students`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/40 text-primary-foreground">
                    {activity.createdBy?.name?.substring(0, 2).toUpperCase() || 'ME'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">
                  {activity.createdBy?.name || 'Me'}
                </span>
              </div>
            )}
          </div>
          
          {/* Last updated time */}
          {timeAgo && (
            <div className="mt-2 text-[10px] text-muted-foreground text-right italic">
              {timeAgo}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 