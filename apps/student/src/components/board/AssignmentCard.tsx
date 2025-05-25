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
  
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="w-full overflow-hidden"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isDragging ? 0.6 : 1,
          scale: isDragging ? 0.95 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 }
        }}
        className="w-full"
      >
        <Card className={`bg-card overflow-hidden max-w-full ${isDragging ? 'bg-muted shadow-md' : ''}`}>
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
                  {activityId.tags && activityId.tags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-4"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}15` : undefined,
                        color: tag.color,
                        borderColor: tag.color ? `${tag.color}30` : undefined
                      }}
                    >
                      {tag.label}
                    </Badge>
                  ))}
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