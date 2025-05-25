"use client";

import { useState, useEffect } from 'react';
import { 
  Card
} from '@intellect-kanban/ui';
import { Calendar, UsersIcon, CheckSquare, Square, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import stc from 'string-to-color';
import { Tag } from '../ui/Tag';
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
  isPendingDeletion?: boolean;
}

export function MetaActivityCard({
  activity,
  isSelected,
  isLoading,
  onSelect,
  onManageStudents,
  isPendingDeletion = false
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
    
  // Calculate the number of assigned students (if available)
  const assignedCount = activity.assignedStudents?.length || 0;
  
  // Generate color from activity ID
  const getActivityColor = () => {
    if (!activity._id) return '#6366F1';
    return stc(activity._id);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="mb-2 relative"
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[1px] rounded-md z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <span className="text-xs font-medium">Loading assignments...</span>
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
        className={`p-3 relative cursor-pointer border-l-4 transition-all hover:shadow-md ${isSelected ? 'bg-muted/50 border-primary' : ''}`}
        style={{ borderLeftColor: getActivityColor() }}
        onClick={() => !isLoading && !isPendingDeletion && onSelect(activity._id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-medium text-sm line-clamp-1 flex items-center gap-1.5">
              <span 
                className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getActivityColor() }}
              ></span>
              {activity.title}
            </h4>
          </div>
          <div className="flex items-center">
            <button 
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading && !isPendingDeletion) {
                  onManageStudents(activity);
                }
              }}
              title="Manage students"
              disabled={isLoading || isPendingDeletion}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="sr-only">Manage students</span>
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading && !isPendingDeletion) {
                  onSelect(activity._id);
                }
              }}
              disabled={isLoading || isPendingDeletion}
            >
              {isSelected ? (
                <CheckSquare className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span className="sr-only">
                {isSelected ? 'Deselect activity' : 'Select activity'}
              </span>
            </button>
          </div>
        </div>
        
        {/* Activity metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {activity.dueDate 
                ? new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : formattedDate}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />
            <span className="text-xs">
              {assignedCount} students
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
        
        {/* Tags section */}
        {resolvedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
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
      </Card>
    </motion.div>
  );
} 