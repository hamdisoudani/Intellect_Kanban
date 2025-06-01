"use client";

import { useState, useEffect } from 'react';
import { 
  Card,
  Avatar,
  AvatarFallback,
  Badge
} from '@intellect-kanban/ui';
import { Calendar, UsersIcon, CheckSquare, Square, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import stc from 'string-to-color';
import { Tag as TagUI } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { Activity, DifficultyLevel } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';
import { formatDistanceToNow } from 'date-fns';

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
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="mb-2.5 relative"
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] rounded-md z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Deletion overlay */}
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] rounded-md z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-destructive border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium text-destructive">Deleting...</span>
          </div>
        </div>
      )}
      
      <Card 
        className={`relative cursor-pointer transition-all hover:shadow-md w-full ${
          isSelected 
            ? 'border-primary/70 shadow-sm bg-primary/5' 
            : 'hover:border-muted-foreground/30'
        }`}
        onClick={handleCardClick}
      >
        {/* Left color indicator */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-sm" 
          style={{ backgroundColor: getActivityColor() }}
        ></div>
        
        <div className="p-3 pl-4">
          {/* Header with title and action buttons */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-sm line-clamp-1 flex-1">
              {activity.title}
            </h4>
            
            <div className="flex items-center gap-1">
              {/* Select button */}
              <button 
                className={`text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary' : ''
                }`}
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
              <button 
                className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
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
            </div>
          </div>
          
          {/* Difficulty badge */}
          {activity.difficultyLevel && (
            <div className="mb-2.5">
              <DifficultyBadge 
                difficultyLevel={activity.difficultyLevel as DifficultyLevel} 
                size="sm"
              />
            </div>
          )}
          
          {/* Tags */}
          {resolvedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Tag className="h-3 w-3" />
                <div className="flex gap-1 items-center">
                  {resolvedTags.slice(0, 2).map((tag: TagType, index: number) => (
                    <TagUI
                      key={tag._id || `tag-${index}`}
                      label={tag.name || 'Unnamed'}
                      color={tag.color || '#6366F1'}
                      size="sm"
                      className="py-0 px-1.5 text-[10px]"
                    />
                  ))}
                  {resolvedTags.length > 2 && (
                    <Badge variant="outline" className="text-[10px] py-0 h-4 px-1">
                      +{resolvedTags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Footer with metadata */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1.5">
            {/* Due date or created date */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{dueDate || formattedDate}</span>
            </div>
            
            {/* Students count with avatars */}
            <div className="flex items-center gap-1.5">
              {assignedCount > 0 ? (
                <div className="flex -space-x-2">
                  {/* Show up to 3 student avatars */}
                  {[...Array(Math.min(3, assignedCount))].map((_, idx) => (
                    <Avatar key={idx} className="h-5 w-5 border border-background">
                      <AvatarFallback className="text-[9px] bg-primary/80 text-primary-foreground">
                        {getStudentInitials(idx)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  
                  {/* Show count for additional students */}
                  {assignedCount > 3 && (
                    <Badge variant="outline" className="h-5 min-w-[20px] text-[10px] px-1 border border-background flex items-center justify-center font-normal">
                      +{assignedCount - 3}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <UsersIcon className="h-3 w-3" />
                  No students
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 