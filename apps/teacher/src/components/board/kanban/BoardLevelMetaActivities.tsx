"use client";

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Tag as TagIcon, Filter, X, Clock, AlertCircle, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';

import stc from 'string-to-color';
import { cn } from '@intellect-kanban/utils';
import React from 'react';

interface BoardLevelMetaActivitiesProps {
  columns: Array<{ id: string; name: string; order?: number }>;
  metaActivities: any[];
  assignments: Record<string, any[]>;
  selectedMetaActivities: Set<string>;
  isLoadingAssignments: Record<string, boolean>;
  collapsedActivities: Set<string>;
  toggleActivityCollapse: (activityId: string) => void;
  handleDragStart: (assignmentId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenAssignmentDetail: (assignment: any) => void;
  
  // Add filter-related props
  selectedStudentFilters?: Set<string>;
  selectedTagFilters?: Set<string>;
  selectedDifficultyFilters?: Set<any>;
  activeFilterCount?: number;
  onClearAllFilters?: () => void;
  selectedActivityFilters?: Set<string>;
}

export function BoardLevelMetaActivities({
  columns,
  metaActivities,
  assignments,
  selectedMetaActivities,
  isLoadingAssignments,
  collapsedActivities,
  toggleActivityCollapse,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenAssignmentDetail,
  
  // Filter props with defaults
  selectedStudentFilters = new Set(),
  selectedTagFilters = new Set(),
  selectedDifficultyFilters = new Set(),
  activeFilterCount = 0,
  onClearAllFilters = () => {},
  selectedActivityFilters = new Set()
}: BoardLevelMetaActivitiesProps) {
  // Filter to only show selected meta activities, and apply activity filter if present
  const filteredMetaActivities = useMemo(() => {
    // If activity filter is empty, show all selected meta activities
    if (!selectedActivityFilters || selectedActivityFilters.size === 0) {
      return metaActivities.filter(activity => selectedMetaActivities.has(activity._id));
    }
    // If activity filter is present, show only those in the filter
    return metaActivities.filter(
      activity => selectedMetaActivities.has(activity._id) && selectedActivityFilters.has(activity._id)
    );
  }, [metaActivities, selectedMetaActivities, selectedActivityFilters]);

  // Group assignments by activity and then by column, with filtering
  const groupedAssignments = useMemo(() => {
    const result: Record<string, Record<string, any[]>> = {};
    
    // Initialize structure for all selected activities
    selectedMetaActivities.forEach(activityId => {
      result[activityId] = {};
      columns.forEach(column => {
        result[activityId][column.id] = [];
      });
    });
    
    // Populate with assignments, applying filters
    Object.entries(assignments).forEach(([activityId, activityAssignments]) => {
      if (selectedMetaActivities.has(activityId)) {
        // Filter assignments based on filter criteria
        const filteredAssignments = activityAssignments.filter(assignment => {
          // Apply student filter if any are selected
          if (selectedStudentFilters.size > 0) {
            const studentId = typeof assignment.studentId === 'object' 
              ? assignment.studentId._id 
              : assignment.studentId;
            if (!selectedStudentFilters.has(studentId)) {
              return false;
            }
          }
          
          // Apply tag filter if any are selected
          if (selectedTagFilters.size > 0) {
            const activity = metaActivities.find(act => act._id === activityId);
            if (!activity || !activity.tags) return false;
            
            const hasMatchingTag = activity.tags.some((tag: any) => {
              const tagId = typeof tag === 'object' ? tag._id : tag;
              return selectedTagFilters.has(tagId);
            });
            
            if (!hasMatchingTag) return false;
          }
          
          // Apply difficulty filter if any are selected
          if (selectedDifficultyFilters.size > 0) {
            const activity = metaActivities.find(act => act._id === activityId);
            if (!activity || !activity.difficultyLevel) return false;
            
            if (!selectedDifficultyFilters.has(activity.difficultyLevel)) {
              return false;
            }
          }
          
          // Assignment passed all filters
          return true;
        });
        
        // Organize filtered assignments by column
        filteredAssignments.forEach(assignment => {
          const columnId = assignment.columnId || 'backlog';
          if (!result[activityId][columnId]) {
            result[activityId][columnId] = [];
          }
          result[activityId][columnId].push(assignment);
        });
      }
    });
    
    return result;
  }, [assignments, selectedMetaActivities, columns, selectedStudentFilters, selectedTagFilters, selectedDifficultyFilters, metaActivities]);

  // Add a method to check if we have active filters
  const hasActiveFilters = activeFilterCount > 0;
  
  // Filter activities that have no matching assignments when filters are active
  const visibleActivities = useMemo(() => {
    if (!hasActiveFilters) return filteredMetaActivities;
    
    return filteredMetaActivities.filter(activity => {
      // Check if this activity has any assignments that passed the filters
      const activityAssignments = groupedAssignments[activity._id] || {};
      const totalAssignments = Object.values(activityAssignments)
        .reduce((sum, columnAssignments) => sum + columnAssignments.length, 0);
      
      // Only show activities that have at least one matching assignment
      return totalAssignments > 0;
    });
  }, [filteredMetaActivities, groupedAssignments, hasActiveFilters]);

  

  return (
    <div className="flex flex-col w-full space-y-3 p-3 sm:p-4 pb-16">
      {/* Header section with controls - simplified further by removing expand/collapse buttons */}
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        {/* Only show title if there are activities to show */}
        {visibleActivities.length > 0 ? (
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-1.5">
            Activities
            <Badge variant="outline" className="font-normal text-xs">
              {visibleActivities.length}
            </Badge>
          </h2>
        ) : (
          <h2 className="text-base sm:text-lg font-semibold">Activities</h2>
        )}
        
        <div className="flex items-center gap-2">
          {/* Only show filters if they're active */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 sm:h-8 text-xs font-medium flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
              onClick={onClearAllFilters}
            >
              <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}</span>
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Activities list with animations */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {visibleActivities.map(activity => (
            <MetaActivityRow
              key={activity._id}
              activity={activity}
              columns={columns}
              columnAssignments={groupedAssignments[activity._id] || {}}
              isCollapsed={collapsedActivities.has(activity._id)}
              toggleCollapse={() => toggleActivityCollapse(activity._id)}
              isLoading={isLoadingAssignments[activity._id] || false}
              handleDragStart={handleDragStart}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleOpenAssignmentDetail={handleOpenAssignmentDetail}
              hasActiveFilters={hasActiveFilters}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* No activities selected state */}
      {filteredMetaActivities.length === 0 && (
        <div className="flex items-center justify-center h-40 sm:h-60 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted/20 flex items-center justify-center">
              <span className="text-xl sm:text-2xl text-muted-foreground">👋</span>
            </div>
            <p className="text-sm sm:text-base font-medium">No activities selected</p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md text-center px-4">
              Please select activities from the sidebar to display them on the board
            </p>
          </div>
        </div>
      )}
      
      {/* Consolidated empty states for filtering */}
      {filteredMetaActivities.length > 0 && 
       (visibleActivities.length === 0 || 
        (visibleActivities.length > 0 && 
         Object.entries(groupedAssignments).every(([_, columns]) => 
           Object.values(columns).every(assignments => assignments.length === 0)
         ))
       ) && 
       hasActiveFilters && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center h-32 sm:h-40 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50 mt-2"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/20 flex items-center justify-center">
              <Filter className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <p className="text-sm sm:text-base font-medium">No items match your filters</p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md text-center px-3">
              Try adjusting your filter criteria
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-1 sm:mt-2 text-xs h-7 sm:h-8 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              onClick={onClearAllFilters}
            >
              Clear All Filters
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface MetaActivityRowProps {
  activity: any;
  columns: Array<{ id: string; name: string; order?: number }>;
  columnAssignments: Record<string, any[]>;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isLoading: boolean;
  handleDragStart: (assignmentId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenAssignmentDetail: (assignment: any) => void;
  hasActiveFilters?: boolean; // Add this prop
}

function MetaActivityRow({
  activity,
  columns,
  columnAssignments,
  isCollapsed,
  toggleCollapse,
  isLoading,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenAssignmentDetail,
  hasActiveFilters
}: MetaActivityRowProps) {
  // Calculate total assignments for this activity
  const totalAssignments = useMemo(() => {
    return Object.values(columnAssignments).reduce(
      (sum, assignments) => sum + assignments.length, 
      0
    );
  }, [columnAssignments]);
  
  // Check if this activity has no assignments matching the filter
  const hasNoMatchingAssignments = hasActiveFilters && totalAssignments === 0;
  
  // Generate consistent color from activity ID
  const activityColor = useMemo(() => {
    return stc(activity._id);
  }, [activity._id]);
  
  // Get the difficulty level label
  const difficultyLabel = useMemo(() => {
    // Import the difficultyLevelLabels from activities.ts
    const { difficultyLevelLabels } = require('@/types/activities');
    
    // Return the proper label from the enum
    return activity.difficultyLevel 
      ? (difficultyLevelLabels[activity.difficultyLevel] || 'Unknown') 
      : 'Not set';
  }, [activity.difficultyLevel]);
  
  // Animation variants
  const containerVariants = {
    collapsed: { 
      height: 64,
      transition: { 
        type: 'spring',
        stiffness: 350,
        damping: 25
      }
    },
    expanded: { 
      height: 'auto',
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 25,
        mass: 0.8
      }
    }
  };
  
  const assignmentsVariants = {
    collapsed: { 
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2
      }
    },
    expanded: { 
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        delay: 0.1
      }
    }
  };
  
  const rotateVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 180 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl overflow-hidden",
        hasNoMatchingAssignments && "opacity-60"
      )}
    >
      <motion.div
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={containerVariants}
        className={cn(
          "bg-card rounded-xl overflow-hidden",
          "transition-all hover:shadow-md",
          "border border-border/50", 
          "relative"
        )}
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        {/* Activity Header - enhanced with better visual hierarchy and colored background */}
        <div 
          className={cn(
            "flex items-center justify-between py-3 px-3 sm:py-4 sm:px-5",
            "cursor-pointer",
            "transition-colors"
          )}
          onClick={toggleCollapse}
          style={{
            background: `linear-gradient(to right, ${activityColor}15, ${activityColor}05)`,
            borderLeft: `4px solid ${activityColor}`,
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                <h3 className="font-semibold truncate text-base sm:text-lg">{activity.title}</h3>
                <Badge variant="outline" className="text-[10px] sm:text-xs bg-background/80 backdrop-blur-sm">
                  {totalAssignments} {totalAssignments === 1 ? 'Assignment' : 'Assignments'}
                </Badge>
                {hasNoMatchingAssignments && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-destructive/10 text-destructive">
                    No matches
                  </Badge>
                )}
                {activity.difficultyLevel && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      activity.difficultyLevel === 'foundational' && "bg-green-100/70 text-green-800 dark:bg-green-900/30 dark:text-green-200",
                      activity.difficultyLevel === 'developing' && "bg-blue-100/70 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                      activity.difficultyLevel === 'proficient' && "bg-amber-100/70 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200", 
                      activity.difficultyLevel === 'advanced' && "bg-orange-100/70 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
                      activity.difficultyLevel === 'mastery' && "bg-red-100/70 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                    )}
                  >
                    {difficultyLabel}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5 sm:mt-1">
                {activity.description || 'No description provided'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 ml-2">
            {activity.tags && activity.tags.length > 0 && (
              <div className="flex items-center gap-1 bg-muted/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                <TagIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {activity.tags.length}
                </span>
              </div>
            )}
            
            <motion.div
              variants={rotateVariants}
              className="text-muted-foreground bg-background/80 backdrop-blur-sm h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
            >
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.div>
          </div>
        </div>
        
        {/* Assignments Grid - with improved animation and styling */}
        <motion.div
          variants={assignmentsVariants}
          className="border-t"
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`
            }}
          >
            {columns.map(column => (
              <div
                key={`${activity._id}-${column.id}`}
                className={cn(
                  "py-2 px-2 sm:py-4 sm:px-3",
                  columns[0].id !== column.id && "border-l",
                  "min-h-[100px] sm:min-h-[120px]"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div 
                  className="text-[10px] sm:text-xs font-medium uppercase tracking-wide px-2 py-1 sm:py-1.5 mb-2 sm:mb-3 text-center rounded-md backdrop-blur-[2px]"
                  style={{
                    background: `linear-gradient(to right, ${activityColor}15, ${activityColor}08)`,
                    color: activityColor,
                    boxShadow: `0 1px 2px ${activityColor}10`
                  }}
                >
                  {column.name}
                </div>
                
                <div className="space-y-2 sm:space-y-3 px-1">
                  {isLoading ? (
                    Array(2).fill(0).map((_, idx) => (
                      <div key={`skeleton-${idx}`} className="h-16 sm:h-20 bg-muted/20 animate-pulse rounded-lg"></div>
                    ))
                  ) : columnAssignments[column.id]?.length > 0 ? (
                    columnAssignments[column.id].map(assignment => (
                      <AssignmentCardWithStudent
                        key={assignment._id}
                        assignment={assignment}
                        columnId={column.id}
                        activityColor={activityColor}
                        handleDragStart={handleDragStart}
                        onClick={() => handleOpenAssignmentDetail(assignment)}
                      />
                    ))
                  ) : hasNoMatchingAssignments ? (
                    <div className="flex items-center justify-center h-16 sm:h-20 border border-dashed rounded-lg bg-destructive/5 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <span>No matching assignments</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16 sm:h-20 border border-dashed rounded-lg bg-muted/10 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted/20 flex items-center justify-center">
                          <span className="text-xs sm:text-sm">+</span>
                        </div>
                        <span>No assignments</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Enhanced Assignment Card with Student focus
function AssignmentCardWithStudent({ 
  assignment, 
  columnId, 
  activityColor,
  handleDragStart, 
  onClick 
}: {
  assignment: any;
  columnId: string;
  activityColor: string;
  handleDragStart: (assignmentId: string, columnId: string) => void;
  onClick: () => void;
}) {
  // Extract student info
  const studentName = assignment.studentId && typeof assignment.studentId === 'object' 
    ? assignment.studentId.name 
    : 'Unknown Student';
  
  // Get student ID for color generation
  const studentId = assignment.studentId && typeof assignment.studentId === 'object' 
    ? assignment.studentId._id || assignment.studentId.id 
    : typeof assignment.studentId === 'string' 
      ? assignment.studentId 
      : 'unknown';
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get status info based on column
  const getStatusInfo = () => {
    switch(columnId) {
      case 'backlog': return { 
        label: 'To Do', 
        icon: <Clock className="h-3 w-3 text-muted-foreground" />,
        bgColor: 'bg-muted/40 dark:bg-muted/20' 
      };
      case 'doing': return { 
        label: 'Working', 
        icon: <AlertCircle className="h-3 w-3 text-amber-500" />,
        bgColor: 'bg-amber-100/70 dark:bg-amber-900/40' 
      };
      case 'review': return { 
        label: 'Review', 
        icon: <MessageSquare className="h-3 w-3 text-blue-500" />,
        bgColor: 'bg-blue-100/70 dark:bg-blue-900/40' 
      };
      case 'done': return { 
        label: 'Done', 
        icon: <CheckCircle2 className="h-3 w-3 text-green-500" />,
        bgColor: 'bg-green-100/70 dark:bg-green-900/40' 
      };
      default: return { 
        label: 'Unknown', 
        icon: <Clock className="h-3 w-3 text-muted-foreground" />,
        bgColor: 'bg-muted/40' 
      };
    }
  };
  
  const status = getStatusInfo();
  
  // Check if the item has feedback
  const hasFeedback = assignment.feedback && assignment.feedback.length > 0;
  
  // Check if the item has unread feedback
  const hasUnreadFeedback = hasFeedback && assignment.feedback.some((f: any) => !f.read);
  
  // Handle drag start with proper event typing
  const handleDragStartEvent = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragStart(assignment._id, columnId);
    e.dataTransfer.setData('text/plain', assignment._id);
  };
  
  // Generate a color based on student ID for consistent student-specific colors
  // Always use studentId for color generation to ensure each student has a unique color
  const studentColor = studentId ? stc(studentId) : activityColor;

  return (
    <div
      className="group cursor-pointer bg-card rounded-lg overflow-hidden hover:shadow-md transition-all border border-border/50"
      style={{
        transform: 'translate3d(0, 0, 0)',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        borderLeft: `3px solid ${studentColor}`
      }}
      draggable
      onClick={onClick}
      onDragStart={handleDragStartEvent}
    >
      {/* Status indicator bar */}
      <div className={cn("h-1 w-full", status.bgColor)} />
      
      <div className="flex flex-col h-full">
        <div className="p-2.5 flex flex-col gap-2">
          {/* Student info with avatar - No activity name shown */}
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
              style={{ backgroundColor: studentColor }}
            >
              {getInitials(studentName)}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-sm truncate max-w-[130px]">
                    {studentName}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] p-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{studentName}</span>
                    {assignment.notes && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{assignment.notes}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Status indicator */}
            <div className="ml-auto flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center", status.bgColor)}>
                      {status.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Status: {status.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Feedback indicator */}
              {hasFeedback && (
                <Badge 
                  variant={hasUnreadFeedback ? "default" : "outline"}
                  className={cn(
                    "h-5 px-1.5 flex items-center gap-1 text-[10px]",
                    hasUnreadFeedback ? "bg-amber-500 text-white" : ""
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>{assignment.feedback.length}</span>
                </Badge>
              )}
            </div>
          </div>
          
          {/* Notes if available */}
          {assignment.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/10 p-2 rounded-md">
              {assignment.notes}
            </p>
          )}
          
          {/* Drag indicator - only visible on hover */}
          <div className="flex items-center justify-end mt-1">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">
              Drag to move
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 