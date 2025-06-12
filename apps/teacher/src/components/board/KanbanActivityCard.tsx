"use client";

import { Card, CardContent, Avatar, Badge, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';
import { PriorityBadge } from './PriorityBadge';
import { useMemo, useEffect, useState } from 'react';
import { CalendarIcon, Users, MessageSquare, Clock, CheckCircle2, AlertCircle, Tag as TagIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Tag } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { DifficultyLevel } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';
import { cn } from '@intellect-kanban/utils';

interface KanbanActivityCardProps {
  item: any; // Can be an activity or an assignment
  itemType: 'activity' | 'assignment';
  columnId?: string;
  isMetaActivity?: boolean;
  isPendingDeletion?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, item: any) => void;
  onDragEnd?: () => void;
  onClick?: (item: any) => void;
}

export function KanbanActivityCard({
  item,
  itemType,
  columnId,
  isMetaActivity = false,
  isPendingDeletion = false,
  onDragStart,
  onDragEnd,
  onClick,
}: KanbanActivityCardProps) {
  // Unify data from activity or assignment
  const activity = itemType === 'activity' ? item : item.activityId;
  const assignment = itemType === 'assignment' ? item : null;
  const student = assignment ? (assignment.studentId as any) : null;

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
  const timeAgo = activity.createdAt 
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
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
      onDragStart(e, item);
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
      onClick(item);
    }
  };

  // Generate color from activity ID - with transparency
  const getBorderColor = () => {
    if (isMetaActivity) {
      return 'rgb(99, 102, 241, 0.8)'; // Indigo color with transparency for meta activities
    }
    
    // Modern UI color palette with soft, professional colors
    const colorPalette = [
      'rgb(14, 165, 233, 0.7)',    // Sky blue
      'rgb(168, 85, 247, 0.7)',    // Purple
      'rgb(59, 130, 246, 0.7)',    // Blue
      'rgb(236, 72, 153, 0.7)',    // Pink
      'rgb(249, 115, 22, 0.7)',    // Orange
      'rgb(16, 185, 129, 0.7)',    // Emerald
      'rgb(245, 158, 11, 0.7)',    // Amber
      'rgb(139, 92, 246, 0.7)',    // Violet
      'rgb(20, 184, 166, 0.7)',    // Teal
      'rgb(239, 68, 68, 0.7)',     // Red
      'rgb(34, 211, 238, 0.7)',    // Cyan
      'rgb(132, 204, 22, 0.7)',    // Lime
    ];
    
    // Use a deterministic approach based on the activity ID
    // This ensures the same activity always gets the same color
    if (!activity._id) return colorPalette[0]; // Default to first color
    
    // Sum the character codes in the ID to get a number
    let sum = 0;
    for (let i = 0; i < activity._id.length; i++) {
      sum += activity._id.charCodeAt(i);
    }
    
    // Use modulo to get an index within the palette range
    const colorIndex = sum % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // Get status icon and color based on column
  const getStatusInfo = () => {
    if (!columnId) return { icon: null, color: 'text-muted-foreground' };
    
    switch (columnId) {
      case 'backlog':
        return { 
          icon: <Clock className="h-3 w-3" aria-label="Backlog" />, 
          color: 'text-muted-foreground',
          label: 'Backlog',
          bgColor: 'bg-muted/40 dark:bg-muted/20'
        };
      case 'doing':
        return { 
          icon: <AlertCircle className="h-3 w-3" aria-label="In Progress" />, 
          color: 'text-amber-500',
          label: 'In Progress',
          bgColor: 'bg-amber-100/50 dark:bg-amber-900/20'
        };
      case 'review':
        return { 
          icon: <MessageSquare className="h-3 w-3" aria-label="In Review" />, 
          color: 'text-blue-500',
          label: 'Review',
          bgColor: 'bg-blue-100/50 dark:bg-blue-900/20'
        };
      case 'done':
        return { 
          icon: <CheckCircle2 className="h-3 w-3" aria-label="Done" />, 
          color: 'text-green-500',
          label: 'Done',
          bgColor: 'bg-green-100/50 dark:bg-green-900/20' 
        };
      default:
        return { 
          icon: null, 
          color: 'text-muted-foreground',
          label: 'Unknown',
          bgColor: 'bg-muted/40'
        };
    }
  };

  // Helper function to get at most 3 tags, and count the rest
  const getDisplayTags = () => {
    if (!resolvedTags || resolvedTags.length === 0) return { displayTags: [], remainingCount: 0 };
    
    const maxDisplayTags = 3; // Show up to 3 tags to maximize usage but avoid overflow
    if (resolvedTags.length <= maxDisplayTags) {
      return { 
        displayTags: resolvedTags,
        remainingCount: 0 
      };
    }
    
    return {
      displayTags: resolvedTags.slice(0, maxDisplayTags),
      remainingCount: resolvedTags.length - maxDisplayTags
    };
  };

  const { displayTags, remainingCount } = getDisplayTags();
  const statusInfo = getStatusInfo();

  // Helper to get student initials
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: isPendingDeletion ? 1 : 1.01, y: -1 }}
      whileTap={{ scale: isPendingDeletion ? 1 : 0.98 }}
      className="mb-3 relative" 
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
        onClick={handleClick}
        draggable={!isMetaActivity}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'w-full cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:shadow-primary/10 group',
          'bg-background/80 dark:bg-zinc-900/50 border-l-4 rounded-lg',
          isPendingDeletion && 'opacity-50 cursor-not-allowed',
        )}
        style={{ borderLeftColor: getBorderColor() }}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Main Content */}
          <div className="p-4">
            <div className="flex justify-between items-start gap-2">
              {/* Title - Only show for activities, not for assignments */}
              {itemType === 'activity' && (
                <h3 className="font-semibold text-sm leading-tight pr-2 flex-1 break-words">
                  {activity?.title || 'Untitled Activity'}
                </h3>
              )}

              {/* Badges for priority or difficulty */}
              <div className="flex-shrink-0">
                {activity?.difficultyLevel && (
                  <DifficultyBadge difficultyLevel={activity.difficultyLevel as DifficultyLevel} />
                )}
                {activity?.priority && (
                  <PriorityBadge priority={activity.priority} />
                )}
              </div>
            </div>

            {/* Student Info for Assignments */}
            {itemType === 'assignment' && student && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] font-semibold bg-muted">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{student.name}</span>
              </div>
            )}

            {/* Tags */}
            {displayTags.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <div className={cn("flex-shrink-0 rounded-full h-5 w-5 flex items-center justify-center", statusInfo.bgColor)}>
                  <TagIcon className={cn("h-3 w-3", statusInfo.color)} />
                </div>
                {displayTags.map((tag: TagType) => (
                  <Tag key={tag._id} label={tag.name} color={tag.color} size="sm" />
                ))}
                {remainingCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="secondary" className="text-xs font-light px-2 py-0.5 h-5 rounded-md">
                          +{remainingCount}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>...and {remainingCount} more tags</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Footer - Only show for activities, not for assignments */}
            {itemType === 'activity' && (
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                  {/* Creator Avatar */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] font-bold bg-muted">
                            {activity?.creator?.name ? getInitials(activity.creator.name) : 'A'}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Created by {activity?.creator?.name || 'Admin'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Due Date */}
                  {formattedDate && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                </div>

                {/* Time Ago */}
                <div className="text-xs text-muted-foreground italic">
                  {timeAgo}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 