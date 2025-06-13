"use client";

import { Card, CardContent, Avatar, Badge, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@intellect-kanban/ui';
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
      transition={{ duration: 0.2, delay: 0.05 }}
      whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
      className={cn(
        "relative rounded-lg overflow-hidden shadow-sm border-l-4",
        isPendingDeletion && "opacity-50 pointer-events-none"
      )}
      style={{ borderColor: getBorderColor() }}
      draggable={!isMetaActivity}
      onClick={handleClick}
    >
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-destructive border-t-transparent animate-spin"></div>
        </div>
      )}
      <Card
        className={cn(
          "w-full rounded-lg cursor-pointer min-h-[90px] flex flex-col justify-between bg-card/80 backdrop-blur-sm",
          "transition-all duration-200",
        )}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="px-3 py-2.5 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h4 className="font-semibold text-sm leading-tight pr-2 truncate">
                {activity.title}
              </h4>
              <Badge 
                variant={activity.difficultyLevel === 'advanced' ? 'destructive' : 'outline'} 
                className={cn(
                  "absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 h-5 font-medium z-10",
                  activity.difficultyLevel === 'advanced' ? 'bg-amber-500/90 hover:bg-amber-500 border-amber-500/90 text-white' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/10'
                )}
              >
                {activity.difficultyLevel === 'advanced' ? 'Advanced' : 'Developing'}
              </Badge>
            </div>
            
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {displayTags.length > 0 ? (
                <>
                  {displayTags.map(tag => (
                    <Tag key={tag._id} label={tag.name} color={tag.color} size="sm" />
                  ))}
                  {remainingCount > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="ml-1 text-xs px-1.5 py-0 h-5 rounded-full cursor-pointer hover:bg-secondary/80 flex-shrink-0"
                        >
                          +{remainingCount}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {resolvedTags.slice(3).map(tag => (
                          <DropdownMenuItem key={tag._id} className="px-2 py-1 text-xs">
                            <Tag
                              label={tag.name}
                              color={tag.color}
                              size="sm"
                              className="py-0.5 px-1.5 text-xs w-full"
                            />
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              ) : null}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] bg-muted-foreground/20">
                  {getInitials(activity.createdBy.name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>

            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 