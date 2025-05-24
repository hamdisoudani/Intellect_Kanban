"use client";

import { Card, CardContent, Avatar, Badge, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';
import { PriorityBadge } from './PriorityBadge';
import { useMemo, useEffect, useState } from 'react';
import { CalendarIcon, Users, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import stc from 'string-to-color';
import { Tag } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { DifficultyLevel } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';

interface KanbanActivityCardProps {
  activity: any;
  columnId?: string;
  isMetaActivity?: boolean;
  isPendingDeletion?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, activity: any) => void;
  onDragEnd?: () => void;
  onClick?: (activity: any) => void;
}

export function KanbanActivityCard({ 
  activity, 
  columnId,
  isMetaActivity = false,
  isPendingDeletion = false,
  onDragStart, 
  onDragEnd,
  onClick
}: KanbanActivityCardProps) {
  // State for resolved tags
  const [resolvedTags, setResolvedTags] = useState<TagType[]>([]);
  const { tags: allTags } = useTags();
  
  // Resolve tags from IDs if needed
  useEffect(() => {
    // Skip if no tags or if activity.tags is not an array
    if (!activity.tags || !Array.isArray(activity.tags) || activity.tags.length === 0) {
      setResolvedTags([]);
      return;
    }
    
    // Check if we have full tag objects or just IDs
    const hasFullTagObjects = activity.tags.some((tag: any) => 
      typeof tag === 'object' && tag !== null && tag.name && tag.color
    );
    
    if (hasFullTagObjects) {
      // We have full tag objects, use them directly
      setResolvedTags(activity.tags);
    } else {
      // We only have tag IDs, try to resolve them from allTags
      const tagIds = activity.tags.map((tag: any) => 
        typeof tag === 'object' && tag !== null ? tag._id : String(tag)
      );
      
      // Find matching tags from all tags
      const matchedTags = tagIds.map((tagId: string) => {
        const matchedTag = allTags.find(tag => tag._id === tagId);
        return matchedTag || { 
          _id: tagId, 
          name: 'Loading...', 
          color: '#6366F1',
          createdBy: '',
          createdAt: '',
          updatedAt: '' 
        };
      });
      
      setResolvedTags(matchedTags);
    }
  }, [activity.tags, allTags]);

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
      whileHover={{ scale: isPendingDeletion ? 1 : 1.02 }}
      whileTap={{ scale: isPendingDeletion ? 1 : 0.98 }}
      className="mb-3 relative" // Added relative for overlay positioning
    >
      {/* Pending deletion overlay */}
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg border border-destructive animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-destructive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs font-medium text-destructive">Deleting...</p>
          </div>
        </div>
      )}

      <Card 
        className={`cursor-pointer hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5 transition-all ${
          isPendingDeletion ? 'opacity-70 pointer-events-none' : ''
        }`}
        style={{ borderLeftWidth: '4px', borderLeftColor: getBorderColor() }}
        draggable={!isMetaActivity && !isPendingDeletion}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={isPendingDeletion ? undefined : handleClick}
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
            
            {/* Priority or Difficulty Level */}
            {activity.difficultyLevel && (
              <DifficultyBadge 
                difficultyLevel={activity.difficultyLevel as DifficultyLevel} 
                size="sm"
                className="ml-auto"
              />
            )}
          </div>
          
          {/* Tags section - now using resolvedTags instead of activity.tags directly */}
          {resolvedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {resolvedTags.map((tag: TagType, index: number) => (
                <Tag
                  key={tag._id || `tag-${index}`}
                  label={tag.name || 'Unnamed tag'}
                  color={tag.color || '#6366F1'}
                  size="sm"
                  className="py-0 px-1.5 text-[10px]"
                />
              ))}
            </div>
          )}
          
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