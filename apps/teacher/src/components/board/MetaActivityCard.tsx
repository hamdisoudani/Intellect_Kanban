"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent,
  Badge
} from '@intellect-kanban/ui';
import { Calendar, UsersIcon, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import stc from 'string-to-color';
import { Tag } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { DifficultyLevel } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';

interface MetaActivityCardProps {
  activity: any;
  isSelected: boolean;
  isLoading: boolean;
  isPendingDeletion?: boolean;
  onSelect: (activityId: string) => void;
  onManageStudents: (activity: any) => void;
}

export function MetaActivityCard({
  activity,
  isSelected,
  isLoading,
  isPendingDeletion = false,
  onSelect,
  onManageStudents
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
  
  // Helper to get the activity ID consistently
  const getActivityId = (activity: any) => {
    return activity.id || activity._id;
  };
  
  // Generate color from activity ID
  const getActivityColor = () => {
    const activityId = getActivityId(activity);
    if (!activityId) return 'border-primary';
    return stc(activityId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: isPendingDeletion ? 1 : 1.01 }}
      whileTap={{ scale: isPendingDeletion ? 1 : 0.99 }}
      className="mb-3 relative"
    >
      {/* Pending deletion overlay */}
      {isPendingDeletion && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg border border-destructive animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-6 w-6 text-destructive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs font-medium text-destructive">Deleting...</p>
          </div>
        </div>
      )}

      {/* Selection checkbox - positioned absolutely */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
        <button
          className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
            isLoading
              ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
              : isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-muted-foreground/30'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(getActivityId(activity));
          }}
          disabled={isLoading || isPendingDeletion}
        >
          {isLoading ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 dark:border-blue-400 border-t-transparent" />
          ) : isSelected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Activity card - now the entire card is clickable to manage students */}
      <Card 
        className={`hover:shadow-md transition-all cursor-pointer pl-8 ${
          isSelected ? 'bg-primary/5 dark:bg-primary/10 border-primary/50' : ''
        } ${
          isPendingDeletion ? 'opacity-70 pointer-events-none' : ''
        }`}
        style={{ borderLeftWidth: '4px', borderLeftColor: getActivityColor() }}
        onClick={isPendingDeletion ? undefined : () => onManageStudents(activity)}
      >
        <CardContent className="p-3">
          {/* Activity title */}
          <div className="mb-2">
            <h4 className="font-medium text-sm line-clamp-1 flex items-center gap-1.5">
              <span 
                className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getActivityColor() }}
              ></span>
              {activity.title}
            </h4>
          </div>
          
          {/* Activity metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {activity.dueDate 
                  ? new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'No due date'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <UsersIcon className="h-3 w-3" />
              <span className="text-xs">
                {activity.assignedStudents?.length || 0} students
              </span>
            </div>
          </div>
          
          {/* Difficulty level */}
          {activity.difficultyLevel && (
            <div className="mb-2">
              <DifficultyBadge 
                difficultyLevel={activity.difficultyLevel as DifficultyLevel} 
                size="sm"
              />
            </div>
          )}
          
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
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              <span className="text-xs text-muted-foreground ml-2">Loading assignments...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 