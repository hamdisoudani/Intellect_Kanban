"use client";

import { useState } from 'react';
import { MetaActivitiesColumn } from './MetaActivitiesColumn';
import { KanbanRegularColumn } from './KanbanRegularColumn';
import { DifficultyLevel } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@intellect-kanban/ui';
import { motion } from 'framer-motion';

interface ClassViewBoardProps {
  columns: Array<{ id: string; name: string; order?: number }>;
  activities: Record<string, any[]>;
  isLoadingActivities: boolean;
  draggingActivity: string | null;
  draggingFromColumn: string | null;
  handleDragStart: (activityId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenActivityDetail: (activity: any) => void;
  deletingActivityId: string;
  
  // Meta activities props
  metaActivities: any[];
  selectedMetaActivities: Set<string>;
  isLoadingAssignments: Record<string, boolean>;
  toggleMetaActivitySelection: (activityId: string) => Promise<void>;
  selectAllMetaActivities: () => Promise<void>;
  handleManageStudents: (activity: any) => void;
  handleViewMetaActivityDetails: (activity: any) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Assignment related props
  getColumnAssignments: (columnId: string) => any[];
  getAllColumnAssignments: (columnId: string) => any[];
  areAllAssignmentsLoading: () => boolean;
  mightHaveAssignmentsLoading: (columnId: string) => boolean;
  
  // Filter related props
  isStudentFilterOpen: boolean;
  setIsStudentFilterOpen: (open: boolean) => void;
  selectedStudentFilters: Set<string>;
  setSelectedStudentFilters: (filters: Set<string>) => void;
  tempStudentFilters: Set<string>;
  setTempStudentFilters: (filters: Set<string>) => void;
  selectedTagFilters: Set<string>;
  setSelectedTagFilters: (filters: Set<string>) => void;
  tempTagFilters: Set<string>;
  setTempTagFilters: (filters: Set<string>) => void;
  selectedDifficultyFilters: Set<DifficultyLevel>;
  setSelectedDifficultyFilters: (filters: Set<DifficultyLevel>) => void;
  tempDifficultyFilters: Set<DifficultyLevel>;
  setTempDifficultyFilters: (filters: Set<DifficultyLevel>) => void;
  activeFilterTab: 'students' | 'tags' | 'difficulty' | 'activities';
  setActiveFilterTab: (tab: 'students' | 'tags' | 'difficulty' | 'activities') => void;
  studentSearchQuery: string;
  setStudentSearchQuery: (query: string) => void;
  tagSearchQuery: string;
  setTagSearchQuery: (query: string) => void;
  
  // Data for filters
  uniqueStudents: { _id: string; name: string }[];
  uniqueTags: TagType[];
  uniqueDifficultyLevels: { level: DifficultyLevel, label: string, color: string }[];
}

export function ClassViewBoard({
  columns,
  activities,
  isLoadingActivities,
  draggingActivity,
  draggingFromColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenActivityDetail,
  deletingActivityId,
  
  // Meta activities props
  metaActivities,
  selectedMetaActivities,
  isLoadingAssignments,
  toggleMetaActivitySelection,
  selectAllMetaActivities,
  handleManageStudents,
  handleViewMetaActivityDetails,
  searchQuery,
  setSearchQuery,
  
  // Assignment related props
  getColumnAssignments,
  getAllColumnAssignments,
  areAllAssignmentsLoading,
  mightHaveAssignmentsLoading,
  
  // Filter related props
  isStudentFilterOpen,
  setIsStudentFilterOpen,
  selectedStudentFilters,
  setSelectedStudentFilters,
  tempStudentFilters,
  setTempStudentFilters,
  selectedTagFilters,
  setSelectedTagFilters,
  tempTagFilters,
  setTempTagFilters,
  selectedDifficultyFilters,
  setSelectedDifficultyFilters,
  tempDifficultyFilters,
  setTempDifficultyFilters,
  activeFilterTab,
  setActiveFilterTab,
  studentSearchQuery,
  setStudentSearchQuery,
  tagSearchQuery,
  setTagSearchQuery,
  
  // Data for filters
  uniqueStudents,
  uniqueTags,
  uniqueDifficultyLevels,
}: ClassViewBoardProps) {
  // State to track collapsed activities (shared across all columns)
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
  
  // State to track if meta-activities column is collapsed
  const [isMetaColumnCollapsed, setIsMetaColumnCollapsed] = useState(false);
  
  // Add state for activity filters
  const [selectedActivityFilters, setSelectedActivityFilters] = useState<Set<string>>(new Set());
  const [tempActivityFilters, setTempActivityFilters] = useState<Set<string>>(new Set());
  const [activitySearchQuery, setActivitySearchQuery] = useState<string>('');
  
  // Set the constant for current view since this is the class view board
  const currentView = 'class';
  
  // Function to toggle collapse for a specific activity
  const toggleActivityCollapse = (activityId: string) => {
    setCollapsedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };
  
  // Function to collapse all activities
  const collapseAllActivities = () => {
    const allIds = new Set<string>();
    // Get all activity IDs from the selected meta activities
    selectedMetaActivities.forEach(id => {
      allIds.add(id);
    });
    setCollapsedActivities(allIds);
  };
  
  // Function to expand all activities
  const expandAllActivities = () => {
    setCollapsedActivities(new Set());
  };
  
  // Function to clear all filters
  const clearAllFilters = () => {
    setSelectedStudentFilters(new Set());
    setSelectedTagFilters(new Set());
    setSelectedDifficultyFilters(new Set());
    setSelectedActivityFilters(new Set()); 
  };
  
  // Helper function to get activity title by ID
  const getActivityTitle = (activityId: string) => {
    const activity = metaActivities.find(activity => activity._id === activityId);
    return activity ? activity.title : 'Unknown Activity';
  };
  
  // Function to filter assignments by selected activities
  const getFilteredColumnAssignments = (columnId: string) => {
    if (currentView !== 'class' || columnId === 'meta-activities') return [];
    
    let filteredAssignments = getAllColumnAssignments(columnId);

    // First apply activity filters if any are selected
    if (selectedActivityFilters.size > 0) {
      // Special case: if we have the "__hide_all__" marker, show no assignments
      if (selectedActivityFilters.has('__hide_all__')) {
        return [];
      }
      
      filteredAssignments = filteredAssignments.filter(assignment => {
        const activityId = typeof assignment.activityId === 'object' 
          ? assignment.activityId._id 
          : assignment.activityId;
        return selectedActivityFilters.has(activityId as string);
      });
    }
    
    // Then apply student filters
    if (selectedStudentFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        const studentId = typeof assignment.studentId === 'object' 
          ? assignment.studentId._id 
          : assignment.studentId;
        return selectedStudentFilters.has(studentId as string);
      });
    }
    
    // Apply tag filters
    if (selectedTagFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        const activityId = typeof assignment.activityId === 'object' 
          ? assignment.activityId._id 
          : assignment.activityId;
        const activity = metaActivities?.find(act => act._id === activityId);
        return activity && Array.isArray(activity.tags) && 
               activity.tags.some((tag: any) => 
                 selectedTagFilters.has(typeof tag === 'object' ? tag._id : tag)
               );
      });
    }
    
    // Apply difficulty filters
    if (selectedDifficultyFilters.size > 0) {
      filteredAssignments = filteredAssignments.filter(assignment => {
        const activityId = typeof assignment.activityId === 'object' 
          ? assignment.activityId._id 
          : assignment.activityId;
        const activity = metaActivities?.find(act => act._id === activityId);
        return activity && activity.difficultyLevel 
          ? selectedDifficultyFilters.has(activity.difficultyLevel) 
          : false;
      });
    }
    
    return filteredAssignments;
  };
  
  return (
    <div className="w-full h-full pb-6 overflow-hidden">
      <div className="flex-1">
        <div className="flex h-full p-4 pb-8 gap-4 max-w-full">
          {/* Meta Activities Column Toggle Button - only shown when column is collapsed */}
          {isMetaColumnCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-full w-8 flex-shrink-0 flex items-center justify-center self-stretch rounded-r-none border-r-0"
                onClick={() => setIsMetaColumnCollapsed(false)}
                title="Show class activities"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
          
          {/* Meta Activities Column - with improved animation for collapsing */}
          <motion.div
            initial={{ width: "280px" }}
            animate={{ 
              width: isMetaColumnCollapsed ? "0px" : "280px",
              opacity: isMetaColumnCollapsed ? 0 : 1,
            }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut",
              opacity: { duration: 0.2 }
            }}
            className="flex-shrink-0 h-full"
            style={{ overflow: "hidden" }}
          >
            <div className="h-full" style={{ width: "280px" }}>
              <MetaActivitiesColumn
                activities={metaActivities}
                selectedMetaActivities={selectedMetaActivities}
                isLoadingActivities={isLoadingActivities}
                isLoadingAssignments={isLoadingAssignments}
                deletingActivityId={deletingActivityId}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                toggleMetaActivitySelection={toggleMetaActivitySelection}
                selectAllMetaActivities={selectAllMetaActivities}
                handleManageStudents={handleManageStudents}
                onViewDetails={handleViewMetaActivityDetails}
                onCollapseColumn={() => setIsMetaColumnCollapsed(true)}
                
                // Filter props
                isStudentFilterOpen={isStudentFilterOpen}
                setIsStudentFilterOpen={setIsStudentFilterOpen}
                selectedStudentFilters={selectedStudentFilters}
                setSelectedStudentFilters={setSelectedStudentFilters}
                tempStudentFilters={tempStudentFilters}
                setTempStudentFilters={setTempStudentFilters}
                selectedTagFilters={selectedTagFilters}
                setSelectedTagFilters={setSelectedTagFilters}
                tempTagFilters={tempTagFilters}
                setTempTagFilters={setTempTagFilters}
                selectedDifficultyFilters={selectedDifficultyFilters}
                setSelectedDifficultyFilters={setSelectedDifficultyFilters}
                tempDifficultyFilters={tempDifficultyFilters}
                setTempDifficultyFilters={setTempDifficultyFilters}
                selectedActivityFilters={selectedActivityFilters}
                setSelectedActivityFilters={setSelectedActivityFilters}
                tempActivityFilters={tempActivityFilters}
                setTempActivityFilters={setTempActivityFilters}
                activeFilterTab={activeFilterTab}
                setActiveFilterTab={setActiveFilterTab}
                studentSearchQuery={studentSearchQuery}
                setStudentSearchQuery={setStudentSearchQuery}
                tagSearchQuery={tagSearchQuery}
                setTagSearchQuery={setTagSearchQuery}
                activitySearchQuery={activitySearchQuery}
                setActivitySearchQuery={setActivitySearchQuery}
                
                // Data for filters
                uniqueStudents={uniqueStudents}
                uniqueTags={uniqueTags}
                uniqueDifficultyLevels={uniqueDifficultyLevels}
                
                // Collapse control
                collapsedActivities={collapsedActivities}
                collapseAllActivities={collapseAllActivities}
                expandAllActivities={expandAllActivities}
              />
            </div>
          </motion.div>
          
          {/* Regular Columns */}
          <motion.div 
            className={`flex gap-4 h-full overflow-hidden pb-6 ${isMetaColumnCollapsed ? 'w-full' : 'flex-1'}`}
            layout
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            {columns.map((column, index) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  flex: 1,
                  width: `${100 / columns.length}%`
                }}
                transition={{ 
                  delay: index * 0.05, 
                  type: "spring",
                  stiffness: 250,
                  damping: 25
                }}
                className="flex-shrink-0 flex-grow"
                style={{ 
                  width: `calc(${100 / columns.length}% - ${(columns.length - 1) * 16 / columns.length}px)`,
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                }}
              >
                <KanbanRegularColumn
                  column={column}
                  currentView="class"
                  activities={[]} // Not used in class view
                  assignments={getFilteredColumnAssignments(column.id)}
                  allAssignments={getAllColumnAssignments(column.id)}
                  isLoadingActivities={isLoadingActivities}
                  areAssignmentsLoading={mightHaveAssignmentsLoading(column.id)}
                  draggingActivity={draggingActivity}
                  draggingFromColumn={draggingFromColumn}
                  selectedMetaActivities={selectedMetaActivities}
                  handleDragStart={handleDragStart}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  handleOpenActivityDetail={handleOpenActivityDetail}
                  deletingActivityId={deletingActivityId}
                  isMetaColumnCollapsed={isMetaColumnCollapsed}
                  
                  // Filter related props
                  selectedStudentFilters={selectedStudentFilters}
                  selectedTagFilters={selectedTagFilters}
                  selectedDifficultyFilters={selectedDifficultyFilters}
                  selectedActivityFilters={selectedActivityFilters}
                  clearAllFilters={clearAllFilters}
                  
                  // Shared collapse state
                  collapsedActivities={collapsedActivities}
                  toggleActivityCollapse={toggleActivityCollapse}
                  collapseAllActivities={collapseAllActivities}
                  expandAllActivities={expandAllActivities}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 