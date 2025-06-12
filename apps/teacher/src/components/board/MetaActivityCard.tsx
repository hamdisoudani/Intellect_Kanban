"use client";

import { useState, useEffect } from 'react';
import { 
  Card,
  Avatar,
  AvatarFallback,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@intellect-kanban/ui';
import { Calendar, UsersIcon, CheckSquare, Square, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import stc from 'string-to-color';
import Color from 'color';
import { Tag as TagUI } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { Activity, DifficultyLevel } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@intellect-kanban/utils';

interface MetaActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (activityId: string) => void;
  onManageStudents: (activity: Activity) => void;
  onViewDetails?: (activity: Activity) => void;
  isPendingDeletion?: boolean;
  isCollapsed?: boolean;
}

export function MetaActivityCard({
  activity,
  isSelected,
  isLoading,
  onSelect,
  onManageStudents,
  onViewDetails,
  isPendingDeletion = false,
  isCollapsed = false
}: MetaActivityCardProps) {
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
      setResolvedTags(activity.tags as unknown as TagType[]);
    } else {
      // We only have tag IDs, try to resolve them from allTags
      const tagIds = activity.tags.map((tag: any) => 
        typeof tag === 'object' && tag !== null ? tag._id : String(tag)
      );
      
      // Find matching tags from all tags
      const matchedTags: TagType[] = tagIds.map((tagId: string) => {
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
  
  // Format the date for display
  const formattedDate = activity.createdAt 
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : 'unknown time';
    
  const dueDate = activity.dueDate 
    ? new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
    
  // Calculate the number of assigned students (if available)
  const assignedCount = activity.assignedStudents?.length || 0;
  
  // Generate color from activity ID
  const getActivityColor = () => {
    if (!activity._id) return '#6366F1';
    return stc(activity._id);
  };

  // Get avatar styles using the activity color
  const getAvatarStyles = (index: number) => {
    try {
      // Get the base color from activity
      const baseColor = getActivityColor();
      
      // Create a Color object for manipulation
      const color = Color(baseColor);
      
      // Create a darker version for the gradient
      // Make each avatar slightly different
      const darkenAmount = 0.1 + (index * 0.05);
      const darkColor = color.darken(darkenAmount).fade(0.1).toString();
      const lightColor = color.lighten(0.1).fade(0.2).toString();
      
      // Determine if we need light or dark text for contrast
      const textColor = color.isDark() ? 'text-white' : 'text-gray-900';
      
      return {
        style: {
          background: `linear-gradient(to bottom right, ${lightColor}, ${darkColor})`,
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.1)`
        },
        textColorClass: textColor
      };
    } catch (e) {
      // Fallback styling if color manipulation fails
      return {
        style: { background: '#e2e8f0' },
        textColorClass: "text-gray-800"
      };
    }
  };

  // Handle card click - open details dialog
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on one of the action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Open the detail dialog
    if (onViewDetails && !isLoading && !isPendingDeletion) {
      onViewDetails(activity);
    }
  };

  // Create initials for students to show in avatar group
  const getStudentInitials = (index: number) => {
    if (!activity.assignedStudents || !Array.isArray(activity.assignedStudents)) return 'ST';
    
    const student = activity.assignedStudents[index];
    if (!student) return 'ST';
    
    const name = typeof student === 'object' && student.name 
      ? student.name 
      : `Student ${index + 1}`;
    
    return name.substring(0, 2).toUpperCase();
  };

  // Card animation variants
  const cardVariants = {
    normal: { scale: 1, y: 0 },
    hover: { scale: 1.01, y: -2 }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Deletion overlay */}
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-destructive border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium text-destructive">Deleting...</span>
          </div>
        </div>
      )}
      
      <motion.div
        variants={cardVariants}
        initial="normal"
        whileHover="hover"
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17 
        }}
      >
      <Card 
          className={cn(
            "relative cursor-pointer w-full rounded-lg shadow-sm",
            "transition-all duration-200",
            "border border-border/50",
            isSelected ? "border-primary/70 bg-primary/5" : "hover:border-muted-foreground/30 hover:shadow-md",
          )}
        onClick={handleCardClick}
      >
        {/* Left color indicator */}
        <div 
            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg" 
          style={{ backgroundColor: getActivityColor() }}
        ></div>
        
        <div className="p-3 pl-4">
          {/* Header with title and action buttons */}
          <div className="flex items-start justify-between gap-2 mb-2">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
            <h4 className="font-medium text-sm line-clamp-1 flex-1">
              {activity.title}
            </h4>
                  </TooltipTrigger>
                  <TooltipContent>
                    {activity.title}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            
            <div className="flex items-center gap-1">
              {/* Select button */}
              <button 
                  className={cn(
                    "text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors",
                    "hover:bg-muted/50",
                    isSelected ? "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary" : ""
                  )}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading && !isPendingDeletion) {
                    onSelect(activity._id);
                  }
                }}
                disabled={isLoading || isPendingDeletion}
                title={isSelected ? "Deselect activity" : "Select activity"}
                aria-label={isSelected ? "Deselect activity" : "Select activity"}
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              
              {/* Manage students button */}
                {isSelected && (
              <button 
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLoading && !isPendingDeletion) {
                    onManageStudents(activity);
                  }
                }}
                disabled={isLoading || isPendingDeletion}
                title="Manage students"
                aria-label="Manage students"
              >
                <UsersIcon className="h-4 w-4" />
              </button>
                )}
          
                {/* Details button */}
                {isSelected && onViewDetails && (
                  <button 
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLoading && !isPendingDeletion && onViewDetails) {
                        onViewDetails(activity);
                      }
                    }}
                    disabled={isLoading || isPendingDeletion}
                    title="View details"
                    aria-label="View details"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                  )}
                  </button>
                )}
              </div>
            </div>
          
            {/* Main content with flexible layout */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {/* Left column */}
              <div className="flex flex-col gap-1.5">
                {/* Difficulty level */}
                {activity.difficultyLevel ? (
                  <DifficultyBadge difficultyLevel={activity.difficultyLevel} />
                ) : (
                  <span className="text-xs text-muted-foreground">No difficulty set</span>
                )}
                
                {/* Student count */}
            <div className="flex items-center gap-1.5">
                <div className="flex -space-x-2">
                    {[...Array(Math.min(assignedCount, 3))].map((_, index) => {
                      const avatarStyles = getAvatarStyles(index);
                      return (
                        <Avatar key={`student-${index}`} className="h-5 w-5 border border-background">
                          <AvatarFallback 
                            className={`text-[8px] font-semibold ${avatarStyles.textColorClass}`}
                            style={avatarStyles.style}
                          >
                            {getStudentInitials(index)}
                      </AvatarFallback>
                    </Avatar>
                      );
                    })}
                  </div>
                  
                  <span className="text-xs text-muted-foreground">
                    {assignedCount > 0 
                      ? `${assignedCount} ${assignedCount === 1 ? 'student' : 'students'}`
                      : 'No students'}
                  </span>
                </div>
              </div>
              
              {/* Right column */}
              <div className="flex flex-col items-end gap-1.5 text-right">
                {/* Due date */}
                {dueDate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">{dueDate}</span>
                  </div>
                )}
                
                {/* Created time */}
                <span className="text-xs text-muted-foreground">
                  {formattedDate}
                </span>
              </div>
            </div>
            
            {/* Tags row - at the bottom for better separation */}
            {resolvedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/30">
                {resolvedTags.slice(0, 3).map(tag => (
                  <TagUI key={tag._id} label={tag.name} color={tag.color} size="sm" />
                ))}
                {resolvedTags.length > 3 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/20">
                          +{resolvedTags.length - 3}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium">Additional tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {resolvedTags.slice(3).map(tag => (
                              <TagUI key={tag._id} label={tag.name} color={tag.color} size="sm" />
                            ))}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
        </div>
      </Card>
      </motion.div>
    </motion.div>
  );
} 