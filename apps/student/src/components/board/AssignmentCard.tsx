"use client";

import { 
  Card, 
  CardContent, 
  Badge,
  CardHeader,
  CardTitle,
  Skeleton
} from '@intellect-kanban/ui';
import { 
  CalendarIcon, 
  ClockIcon, 
  PaperclipIcon, 
  CircleIcon 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { formatMinutesToTime } from '@/utils/format';
import React from 'react';
import { FrontendTag } from '@/types';

interface ActivityData {
  title?: string;
  description?: string;
  dueDate?: string | Date;
  tags?: FrontendTag[];
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  attachments?: any[];
}

interface AssignmentCardProps {
  id: string;
  activityId?: ActivityData; 
  columnId: string;
  position: number;
  status?: string;
  isDragging?: boolean;
  isPendingUpdate?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  id,
  activityId,
  columnId,
  position,
  status,
  isDragging,
  isPendingUpdate = false,
  onDragStart,
  onDragEnd,
}) => {
  // Format due date if available
  const formattedDueDate = activityId?.dueDate 
    ? formatDistanceToNow(new Date(activityId.dueDate), { addSuffix: true })
    : null;
    
  // Get status icon based on status
  const getStatusIcon = () => {
    return <CircleIcon className={`h-3 w-3 ${getStatusColor()}`} />;
  };
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-500';
      case 'IN_PROGRESS':
        return 'text-blue-500';
      case 'OVERDUE':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get card border color based on status
  const getCardBorderStyle = () => {
    let color = '';
    
    switch (status) {
      case 'COMPLETED':
        color = 'rgba(34, 197, 94, 0.7)'; // green-500
        break;
      case 'IN_PROGRESS':
        color = 'rgba(59, 130, 246, 0.7)'; // blue-500
        break;
      case 'OVERDUE':
        color = 'rgba(239, 68, 68, 0.7)'; // red-500
        break;
      default:
        color = 'rgba(156, 163, 175, 0.3)'; // gray-400
    }
    
    return {
      borderLeft: `3px solid ${color}`
    };
  };
  
  return (
    <div
      draggable={!isPendingUpdate}
      onDragStart={!isPendingUpdate ? onDragStart : undefined}
      onDragEnd={!isPendingUpdate ? onDragEnd : undefined}
      className="w-full overflow-hidden"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: isDragging || isPendingUpdate ? 0.6 : 1,
          scale: isDragging ? 0.98 : 1,
          y: isDragging ? -5 : 0,
        }}
        exit={{ opacity: 0, y: 10 }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.15 },
          y: { duration: 0.2 }
        }}
        className="w-full relative"
        whileHover={{ scale: isPendingUpdate ? 1 : 1.01, y: isPendingUpdate ? 0 : -2 }}
      >
        {/* Pending update overlay */}
        {isPendingUpdate && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg border border-primary animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-xs font-medium text-primary">Updating...</p>
            </div>
          </div>
        )}
        
        <Card 
          className={`bg-card overflow-hidden max-w-full transition-all ${
            isDragging 
              ? 'bg-muted/50 shadow-md ring-1 ring-primary/30' 
              : isPendingUpdate 
                ? 'opacity-70 pointer-events-none'
                : 'hover:shadow-sm'
          }`}
          style={getCardBorderStyle()}
        >
          <CardHeader className="px-3 py-2 pb-1">
            {activityId?.title ? (
              <CardTitle className="text-sm font-medium truncate">
                {activityId.title}
              </CardTitle>
            ) : (
              <Skeleton className="h-4 w-2/3" />
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            {activityId ? (
              <div className="space-y-2 max-w-full">
                {activityId.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {activityId.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 max-w-full">
                  {activityId.tags && activityId.tags.length > 0 && (
                    <>
                      {activityId.tags.slice(0, 3).map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4 truncate max-w-[80px]"
                          title={tag.label}
                          style={{
                            backgroundColor: tag.color ? `${tag.color}15` : undefined,
                            color: tag.color,
                            borderColor: tag.color ? `${tag.color}30` : undefined
                          }}
                        >
                          {tag.label}
                        </Badge>
                      ))}
                      {activityId.tags.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          +{activityId.tags.length - 3}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5 pt-1.5 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    {formattedDueDate && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span className={status === 'OVERDUE' ? 'text-red-500' : ''}>
                          {formattedDueDate}
                        </span>
                      </div>
                    )}
                    
                    {activityId.difficultyLevel && (
                      <div className="flex items-center">
                        <span className="text-[10px] px-1 py-0 rounded bg-muted">
                          {activityId.difficultyLevel}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    
                    {activityId.estimatedTimeMinutes && (
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        <span>{formatMinutesToTime(activityId.estimatedTimeMinutes)}</span>
                      </div>
                    )}

                    {activityId.attachments && activityId.attachments.length > 0 && (
                      <div className="flex items-center">
                        <PaperclipIcon className="h-3 w-3 mr-1" />
                        <span>{activityId.attachments.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Skeleton className="h-4 w-2/3" />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AssignmentCard; 