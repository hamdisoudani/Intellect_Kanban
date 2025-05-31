"use client";

import { Button, Input, Badge } from '@intellect-kanban/ui';
import { Search, Square, CheckSquare, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MetaActivityCard } from '../MetaActivityCard';
import { AdvancedFilterPanel } from './AdvancedFilterPanel';
import { DifficultyLevel } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';

interface MetaActivitiesColumnProps {
  activities: any[]; // Array of meta activities
  selectedMetaActivities: Set<string>;
  isLoadingActivities: boolean;
  isLoadingAssignments: Record<string, boolean>;
  deletingActivityId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleMetaActivitySelection: (activityId: string) => Promise<void>;
  selectAllMetaActivities: () => Promise<void>;
  handleManageStudents: (activity: any) => void;
  onCollapseColumn?: () => void; // New prop for collapsing the column
  
  // Filter props
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
  
  // Collapse control for activities
  collapsedActivities?: Set<string>;
  collapseAllActivities?: () => void;
  expandAllActivities?: () => void;
}

export function MetaActivitiesColumn({
  activities,
  selectedMetaActivities,
  isLoadingActivities,
  isLoadingAssignments,
  deletingActivityId,
  searchQuery,
  setSearchQuery,
  toggleMetaActivitySelection,
  selectAllMetaActivities,
  handleManageStudents,
  onCollapseColumn,
  
  // Filter props
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
  
  // Collapse control
  collapsedActivities,
  collapseAllActivities,
  expandAllActivities
}: MetaActivitiesColumnProps) {
  // Function to filter meta activities by search query
  const getFilteredMetaActivities = () => {
    if (!searchQuery.trim()) {
      return activities;
    }
    
    return activities.filter(activity => 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Check if all activities are collapsed
  const areAllCollapsed = () => {
    if (!collapsedActivities || !activities || activities.length === 0) return false;
    return activities.every(activity => collapsedActivities.has(activity._id));
  };
  
  // Filter panel functionality
  const applyFilters = () => {
    // Apply all filters at once
    setSelectedStudentFilters(new Set(tempStudentFilters));
    setSelectedTagFilters(new Set(tempTagFilters));
    setSelectedDifficultyFilters(new Set(tempDifficultyFilters));
    setIsStudentFilterOpen(false);
  };
  
  const clearFilters = () => {
    // Reset all temporary filters
    setTempStudentFilters(new Set());
    setTempTagFilters(new Set());
    setTempDifficultyFilters(new Set());
  };
  
  return (
    <motion.div 
      className="flex flex-col h-full border rounded-lg overflow-hidden bg-card min-w-[280px] max-w-[280px] shadow-sm"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut" 
      }}
    >
      {/* Column Header */}
      <motion.div 
        className="p-3 border-b bg-muted/30 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Class Activities</span>
          <Badge variant="outline" className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {activities?.length || 0}
          </Badge>
        </div>
        <div className="flex gap-1">
          {/* Filter button - only show when at least one activity is selected */}
          {selectedMetaActivities.size > 0 && (
            <AdvancedFilterPanel 
              isOpen={isStudentFilterOpen}
              onOpenChange={setIsStudentFilterOpen}
              selectedStudentFilters={selectedStudentFilters}
              tempStudentFilters={tempStudentFilters}
              setTempStudentFilters={setTempStudentFilters}
              selectedTagFilters={selectedTagFilters}
              tempTagFilters={tempTagFilters}
              setTempTagFilters={setTempTagFilters}
              selectedDifficultyFilters={selectedDifficultyFilters}
              tempDifficultyFilters={tempDifficultyFilters}
              setTempDifficultyFilters={setTempDifficultyFilters}
              activeFilterTab={activeFilterTab}
              setActiveFilterTab={setActiveFilterTab}
              studentSearchQuery={studentSearchQuery}
              setStudentSearchQuery={setStudentSearchQuery}
              tagSearchQuery={tagSearchQuery}
              setTagSearchQuery={setTagSearchQuery}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              uniqueStudents={uniqueStudents}
              uniqueTags={uniqueTags}
              uniqueDifficultyLevels={uniqueDifficultyLevels}
            />
          )}
          
          {/* Collapse/Expand all button */}
          {selectedMetaActivities.size > 0 && collapsedActivities && (collapseAllActivities || expandAllActivities) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted/70"
              onClick={areAllCollapsed() ? expandAllActivities : collapseAllActivities}
              title={areAllCollapsed() ? "Expand all" : "Collapse all"}
            >
              <motion.div
                animate={{ rotate: areAllCollapsed() ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              <span className="sr-only">{areAllCollapsed() ? "Expand all" : "Collapse all"}</span>
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 hover:bg-muted/70" 
            onClick={selectAllMetaActivities}
            disabled={Object.values(isLoadingAssignments).some(loading => loading)}
          >
            {activities?.length > 0 && 
             selectedMetaActivities.size === activities?.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span className="sr-only">Select All</span>
          </Button>
          
          {/* Collapse column button */}
          {onCollapseColumn && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-muted/70"
              onClick={onCollapseColumn}
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Collapse sidebar</span>
            </Button>
          )}
        </div>
      </motion.div>
      
      {/* Search Bar */}
      <motion.div 
        className="px-3 py-2 border-b"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </motion.div>
      
      {/* Activities List */}
      <motion.div 
        className="flex-1 p-2 pb-4 overflow-y-auto max-h-[calc(100vh-180px)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {isLoadingActivities ? (
            // Skeleton loaders for activities
            Array(3).fill(0).map((_, index) => (
              <motion.div 
                key={`skeleton-${index}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, delay: index * 0.1 }}
                className="rounded-md border p-3 mb-3 animate-pulse bg-muted/20"
              >
                <div className="h-4 w-4/5 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 w-1/3 bg-muted-foreground/15 rounded"></div>
                  <div className="flex space-x-1">
                    <div className="h-4 w-4 rounded-full bg-muted-foreground/15"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : getFilteredMetaActivities().length > 0 ? (
            // Activity cards
            getFilteredMetaActivities().map((activity, index) => (
              <motion.div 
                key={activity._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  ease: [0.2, 0.65, 0.3, 0.9] 
                }}
                layout
              >
                <MetaActivityCard
                  activity={activity}
                  isSelected={selectedMetaActivities.has(activity._id)}
                  onSelect={toggleMetaActivitySelection}
                  onManageStudents={handleManageStudents}
                  isPendingDeletion={deletingActivityId === activity._id}
                  isLoading={isLoadingAssignments[activity._id]}
                  isCollapsed={collapsedActivities?.has(activity._id)}
                />
              </motion.div>
            ))
          ) : (
            // Empty state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[200px] p-4 text-center"
            >
              <div className="text-muted-foreground text-sm">
                {searchQuery ? (
                  <>
                    <p className="font-medium">No activities found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">No class activities</p>
                    <p className="text-xs mt-1">Create activities to view them here</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
} 