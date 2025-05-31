"use client";

import { useState, useMemo } from 'react';
import { Button, Badge } from '@intellect-kanban/ui';
import { Filter, X, UsersIcon, TagIcon, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanActivityCard } from '../KanbanActivityCard';
import { AssignmentCard } from '../AssignmentCard';
import stc from 'string-to-color';

interface KanbanRegularColumnProps {
  column: { id: string; name: string; order?: number };
  currentView: 'personal' | 'class';
  activities: any[]; // Personal activities in this column
  assignments: any[]; // Assignments in this column
  allAssignments: any[]; // All assignments without filters for counts
  isLoadingActivities: boolean;
  areAssignmentsLoading: boolean;
  draggingActivity: string | null;
  draggingFromColumn: string | null;
  selectedMetaActivities: Set<string>;
  handleDragStart: (activityId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenActivityDetail: (activity: any) => void;
  deletingActivityId: string;
  onAddActivity?: (columnId: string) => void;
  isMetaColumnCollapsed?: boolean;
  
  // Filter related props
  selectedStudentFilters: Set<string>;
  selectedTagFilters: Set<string>;
  selectedDifficultyFilters: Set<any>;
  clearAllFilters: () => void;

  // Shared collapse state
  collapsedActivities?: Set<string>;
  toggleActivityCollapse?: (activityId: string) => void;
  collapseAllActivities?: () => void;
  expandAllActivities?: () => void;
}

export function KanbanRegularColumn({
  column,
  currentView,
  activities,
  assignments,
  allAssignments,
  isLoadingActivities,
  areAssignmentsLoading,
  draggingActivity,
  draggingFromColumn,
  selectedMetaActivities,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenActivityDetail,
  deletingActivityId,
  onAddActivity,
  isMetaColumnCollapsed,
  
  // Filter related props
  selectedStudentFilters,
  selectedTagFilters,
  selectedDifficultyFilters,
  clearAllFilters,

  // Shared collapse state
  collapsedActivities = new Set<string>(),
  toggleActivityCollapse = () => {},
  collapseAllActivities = () => {},
  expandAllActivities = () => {}
}: KanbanRegularColumnProps) {
  // Check if any filters are active
  const hasActiveFilters = selectedStudentFilters.size > 0 || 
                           selectedTagFilters.size > 0 || 
                           selectedDifficultyFilters.size > 0;

  // Get the appropriate count for the column badge
  const getColumnBadgeCount = () => {
    if (currentView === 'personal') {
      // For personal view, use activity count
      return activities?.length || 0;
    } else {
      // For class view, use filtered assignment count
      return assignments?.length || 0;
    }
  };
  
  // Group assignments by activity
  const groupedAssignments = useMemo(() => {
    if (currentView !== 'class' || assignments.length === 0) return {};
    
    const groups: Record<string, any[]> = {};
    
    assignments.forEach(assignment => {
      const activityId = typeof assignment.activityId === 'object' 
        ? assignment.activityId._id 
        : assignment.activityId;
        
      if (!groups[activityId]) {
        groups[activityId] = [];
      }
      groups[activityId].push(assignment);
    });
    
    return groups;
  }, [assignments, currentView]);
  
  // Get activity titles for the groups
  const activityGroups = useMemo(() => {
    return Object.keys(groupedAssignments).map(activityId => {
      // Try to find the activity title from the first assignment
      const firstAssignment = groupedAssignments[activityId][0];
      const activity = typeof firstAssignment.activityId === 'object' 
        ? firstAssignment.activityId 
        : { _id: activityId, title: 'Unknown Activity' };
        
      return {
        id: activityId,
        title: activity.title || 'Unknown Activity',
        count: groupedAssignments[activityId].length,
        color: stc(activityId)
      };
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [groupedAssignments]);
  
  // Check if all activities are collapsed
  const areAllCollapsed = activityGroups.length > 0 && 
    activityGroups.every(group => collapsedActivities.has(group.id));
  
  return (
    <div 
      className={`flex flex-col h-full border rounded-lg overflow-hidden bg-card shadow-sm ${
        currentView === 'personal' 
          ? '' 
          : isMetaColumnCollapsed 
            ? 'min-w-[280px] flex-1' 
            : 'min-w-[280px] max-w-[280px]'
      }`}
      onDragOver={(e) => handleDragOver(e, column.id)}
      onDrop={(e) => handleDrop(e, column.id)}
    >
      {/* Column Header */}
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{column.name}</span>
          <Badge variant="outline" className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {getColumnBadgeCount()}
          </Badge>
          
          {/* Show filtered vs total count when filters are active in class view */}
          {currentView === 'class' && hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {assignments?.length}/{allAssignments?.length}
            </span>
          )}
        </div>
        
        {/* Filter badges in class view */}
        {currentView === 'class' && hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto mr-2 flex items-center gap-2"
          >
            {/* Show active filter counts */}
            <div className="flex items-center gap-1">
              {selectedStudentFilters.size > 0 && (
                <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                  <UsersIcon className="h-2.5 w-2.5 mr-0.5" />
                  {selectedStudentFilters.size}
                </Badge>
              )}
              {selectedTagFilters.size > 0 && (
                <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                  <TagIcon className="h-2.5 w-2.5 mr-0.5" />
                  {selectedTagFilters.size}
                </Badge>
              )}
              {selectedDifficultyFilters.size > 0 && (
                <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px]">
                  <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                  {selectedDifficultyFilters.size}
                </Badge>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5" 
              onClick={clearAllFilters}
              title="Clear filters"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear filters</span>
            </Button>
          </motion.div>
        )}
        
        {/* Add activity button in personal view */}
        {currentView === 'personal' && onAddActivity && (
          <button 
            className="text-xs text-muted-foreground hover:text-foreground p-1 rounded"
            onClick={() => onAddActivity(column.id)}
          >
            +
          </button>
        )}
        
        {/* Expand/Collapse All button for class view */}
        {currentView === 'class' && activityGroups.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1 text-xs"
            onClick={areAllCollapsed ? expandAllActivities : collapseAllActivities}
            title={areAllCollapsed ? "Expand all" : "Collapse all"}
          >
            {areAllCollapsed ? (
              <ChevronDown className="h-3 w-3 mr-1" />
            ) : (
              <ChevronUp className="h-3 w-3 mr-1" />
            )}
            {areAllCollapsed ? "Expand" : "Collapse"}
          </Button>
        )}
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 pb-4 overflow-y-auto max-h-[calc(100vh-180px)]">
        <div className="space-y-2">
          {/* Loading Skeletons */}
          {isLoadingActivities && currentView === 'personal' && (
            Array(3).fill(0).map((_, index) => (
              <div key={`skeleton-${index}`} className="rounded-md border p-2 animate-pulse">
                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/4 bg-muted-foreground/15 rounded"></div>
                  <div className="h-3 w-1/6 bg-muted-foreground/15 rounded"></div>
                </div>
              </div>
            ))
          )}
          
          {/* Personal Activities - Only in personal view */}
          {currentView === 'personal' && !isLoadingActivities && (
            activities?.map((activity) => (
              <KanbanActivityCard 
                key={activity._id}
                activity={activity}
                onClick={handleOpenActivityDetail}
                isPendingDeletion={deletingActivityId === activity._id}
                isMetaActivity={activity.type === 'meta'}
                onDragStart={(e, activity) => {
                  if (activity.type === 'meta') return;
                  
                  handleDragStart(activity._id, column.id);
                  // Set ghost image data
                  e.dataTransfer.setData('text/plain', activity._id);
                }}
              />
            ))
          )}
          
          {/* Assignments - Only in class view, grouped by activity */}
          {currentView === 'class' && (
            <>
              <AnimatePresence>
                {activityGroups.map(group => (
                  <div key={group.id} className="mb-4">
                    {/* Activity Group Header */}
                    <div 
                      className="flex items-center justify-between py-2 px-2 mb-2 bg-muted/40 rounded-md cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => toggleActivityCollapse(group.id)}
                      style={{ borderLeft: `4px solid ${group.color}` }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: group.color }}></span>
                        <span className="text-xs font-medium">{group.title}</span>
                        <Badge variant="outline" className="h-5 px-1.5 ml-1">
                          {group.count}
                        </Badge>
                      </div>
                      <motion.div
                        initial={{ rotate: collapsedActivities.has(group.id) ? 0 : 180 }}
                        animate={{ rotate: collapsedActivities.has(group.id) ? 0 : 180 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </motion.div>
                    </div>
                    
                    {/* Assignments for this activity */}
                    <AnimatePresence>
                      {!collapsedActivities.has(group.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden pl-1 pr-1"
                        >
                          {groupedAssignments[group.id].map((assignment, idx) => (
                            <motion.div 
                              key={assignment._id} 
                              className="mb-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                delay: idx * 0.05, 
                                duration: 0.2,
                                ease: [0.2, 0.65, 0.3, 0.9]  
                              }}
                            >
                              <AssignmentCard
                                assignment={assignment}
                                activityId={group.id}
                                activityColor={group.color}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </AnimatePresence>
              
              {/* Assignment loading state */}
              {areAssignmentsLoading && assignments.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center items-center p-4 text-sm text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    <span>Loading assignments...</span>
                  </div>
                </motion.div>
              )}
              
              {/* Empty state - with filters active */}
              {!areAssignmentsLoading && assignments.length === 0 && selectedMetaActivities.size > 0 && hasActiveFilters && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md min-h-[200px] justify-center"
                >
                  <Filter className="h-5 w-5 mb-2 text-muted-foreground/50" />
                  <span className="font-medium">No matching assignments</span>
                  <div className="text-xs mt-2 flex items-center gap-1.5 flex-wrap justify-center">
                    {selectedStudentFilters.size > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted/40 rounded-full">
                        <UsersIcon className="h-3 w-3" /> 
                        {selectedStudentFilters.size}
                      </span>
                    )}
                    {selectedTagFilters.size > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted/40 rounded-full">
                        <TagIcon className="h-3 w-3" />
                        {selectedTagFilters.size}
                      </span>
                    )}
                    {selectedDifficultyFilters.size > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted/40 rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        {selectedDifficultyFilters.size}
                      </span>
                    )}
                    <span>filters active</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 h-7 text-xs"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </Button>
                </motion.div>
              )}
              
              {/* Empty state - no filters active */}
              {!areAssignmentsLoading && assignments.length === 0 && selectedMetaActivities.size > 0 && !hasActiveFilters && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center p-6 text-sm text-muted-foreground border border-dashed rounded-md min-h-[200px] justify-center"
                >
                  <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                    <span className="text-lg">📋</span>
                  </div>
                  <span className="font-medium">No assignments in this column</span>
                  <p className="text-xs mt-1 text-muted-foreground">Move assignments here from other columns</p>
                </motion.div>
              )}
              
              {/* Select an activity state */}
              {!areAssignmentsLoading && selectedMetaActivities.size === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-md min-h-[200px] flex flex-col items-center justify-center"
                >
                  <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-2">
                    <span className="text-xl">👈</span>
                  </div>
                  <span className="font-medium">Select class activities</span>
                  <p className="text-xs mt-1">from the sidebar to view student assignments</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}