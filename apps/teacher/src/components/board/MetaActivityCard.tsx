"use client";

import { useState } from 'react';
import { 
  Card, 
  CardContent,
  Badge
} from '@intellect-kanban/ui';
import { Calendar, UsersIcon, CheckSquare, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import stc from 'string-to-color';

interface MetaActivityCardProps {
  activity: any;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (activityId: string) => void;
  onManageStudents: (activity: any) => void;
}

export function MetaActivityCard({
  activity,
  isSelected,
  isLoading,
  onSelect,
  onManageStudents
}: MetaActivityCardProps) {
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="mb-3 relative"
    >
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
          disabled={isLoading}
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
        }`}
        style={{ borderLeftWidth: '4px', borderLeftColor: getActivityColor() }}
        onClick={() => onManageStudents(activity)}
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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