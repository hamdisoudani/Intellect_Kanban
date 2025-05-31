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
  activeFilterTab: 'students' | 'tags' | 'difficulty';
  setActiveFilterTab: (tab: 'students' | 'tags' | 'difficulty') => void;
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
  };
  
  return (
    <div className="w-full h-full">
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full p-4 gap-4">
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
                activeFilterTab={activeFilterTab}
                setActiveFilterTab={setActiveFilterTab}
                studentSearchQuery={studentSearchQuery}
                setStudentSearchQuery={setStudentSearchQuery}
                tagSearchQuery={tagSearchQuery}
                setTagSearchQuery={setTagSearchQuery}
                
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
            className={`flex gap-4 h-full overflow-x-auto pb-2 ${isMetaColumnCollapsed ? 'w-full' : 'flex-1'}`}
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
                  flex: isMetaColumnCollapsed ? 1 : "none",
                  width: isMetaColumnCollapsed ? `${100 / columns.length}%` : "auto"
                }}
                transition={{ 
                  delay: index * 0.05, 
                  type: "spring",
                  stiffness: 250,
                  damping: 25
                }}
                className={isMetaColumnCollapsed ? "min-w-0" : ""}
              >
                <KanbanRegularColumn
                  column={column}
                  currentView="class"
                  activities={[]} // Not used in class view
                  assignments={getColumnAssignments(column.id)}
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