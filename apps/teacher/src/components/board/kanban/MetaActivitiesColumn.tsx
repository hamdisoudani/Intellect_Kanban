"use client";

import { Button, Input, Badge } from '@intellect-kanban/ui';
import { Search, Square, CheckSquare, ChevronLeft, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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
  onViewDetails: (activity: any) => void;
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
  selectedActivityFilters?: Set<string>;
  setSelectedActivityFilters?: (filters: Set<string>) => void;
  tempActivityFilters?: Set<string>;
  setTempActivityFilters?: (filters: Set<string>) => void;
  activeFilterTab: 'students' | 'tags' | 'difficulty' | 'activities';
  setActiveFilterTab: (tab: 'students' | 'tags' | 'difficulty' | 'activities') => void;
  studentSearchQuery: string;
  setStudentSearchQuery: (query: string) => void;
  tagSearchQuery: string;
  setTagSearchQuery: (query: string) => void;
  activitySearchQuery?: string;
  setActivitySearchQuery?: (query: string) => void;
  
  // Data for filters
  uniqueStudents: { _id: string; name: string }[];
  uniqueTags: TagType[];
  uniqueDifficultyLevels: { level: DifficultyLevel, label: string, color: string }[];
  
  // Collapse control for activities
  collapsedActivities?: Set<string>;
  collapseAllActivities?: () => void;
  expandAllActivities?: () => void;
  hideHeader?: boolean;
  hideFilterButton?: boolean;
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
  onViewDetails,
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
  selectedActivityFilters = new Set<string>(),
  setSelectedActivityFilters = () => {},
  tempActivityFilters = new Set<string>(),
  setTempActivityFilters = () => {},
  activeFilterTab,
  setActiveFilterTab,
  studentSearchQuery,
  setStudentSearchQuery,
  tagSearchQuery,
  setTagSearchQuery,
  activitySearchQuery = '',
  setActivitySearchQuery = () => {},
  
  // Data for filters
  uniqueStudents,
  uniqueTags,
  uniqueDifficultyLevels,
  
  // Collapse control
  collapsedActivities,
  collapseAllActivities,
  expandAllActivities,
  hideHeader = false,
  hideFilterButton = false,
}: MetaActivitiesColumnProps) {
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus the search input when it becomes visible
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);
  
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
    setSelectedActivityFilters(new Set(tempActivityFilters));
    setIsStudentFilterOpen(false);
  };
  
  const clearFilters = () => {
    // Reset all temporary filters
    setTempStudentFilters(new Set());
    setTempTagFilters(new Set());
    setTempDifficultyFilters(new Set());
    setTempActivityFilters(new Set());
  };

  // Calculate active filter count
  const activeFilterCount = selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size;
  
  // Clear all applied filters
  const clearAllAppliedFilters = () => {
    setSelectedStudentFilters(new Set());
    setSelectedTagFilters(new Set());
    setSelectedDifficultyFilters(new Set());
    setSelectedActivityFilters(new Set());
  };
  
  return (
    <motion.div 
      className="flex flex-col h-full overflow-hidden bg-card rounded-xl shadow-sm border border-border/50"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3,
        ease: "easeOut" 
      }}
    >
      {/* Column Header - Enhanced with filter indicators */}
      {!hideHeader && (
      <motion.div 
        className="p-4 border-b bg-gradient-to-r from-muted/50 to-muted/10 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
          {!showSearch ? (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">Class Activities</span>
          <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {activities?.length || 0}
          </Badge>
        </div>
          ) : (
            <div className="flex-1 pr-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setShowSearch(false)}
                placeholder="Search activities..."
                className="w-full h-9 px-3 rounded bg-muted text-sm border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        <div className="flex gap-1">
            {/* Search button */}
            {!showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            
            {/* Filter button - Always visible unless hideFilterButton is true */}
            {!hideFilterButton && (
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
              selectedActivityFilters={selectedActivityFilters}
              tempActivityFilters={tempActivityFilters}
              setTempActivityFilters={setTempActivityFilters}
                uniqueStudents={uniqueStudents}
                uniqueTags={uniqueTags}
                uniqueDifficultyLevels={uniqueDifficultyLevels}
              activeFilterTab={activeFilterTab}
              setActiveFilterTab={setActiveFilterTab}
                tagSearchQuery={tagSearchQuery}
                setTagSearchQuery={setTagSearchQuery}
              studentSearchQuery={studentSearchQuery}
              setStudentSearchQuery={setStudentSearchQuery}
                selectAllMetaActivities={selectAllMetaActivities}
                toggleMetaActivitySelection={toggleMetaActivitySelection}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
            />
            )}
          
          {/* Collapse button */}
            {onCollapseColumn && !hideFilterButton && (
            <Button
              variant="ghost"
              size="icon"
                className="h-7 w-7 p-0"
              onClick={onCollapseColumn}
                aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>
      )}
      
      {/* Active Filter Indicators - Let's remove this from the sidebar since it's shown on the board */}
      {/* We'll keep a simplified indicator here instead of detailed filters */}
      {activeFilterCount > 0 && (
        <div className="px-3 py-2 bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full hover:bg-primary/10"
              onClick={clearAllAppliedFilters}
              title="Clear all filters"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Activities List with improved spacing and organization */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoadingActivities ? (
          // Skeleton loading state
          Array(5).fill(0).map((_, index) => (
            <div key={`loading-${index}`} className="h-[80px] bg-muted/20 animate-pulse rounded-lg"></div>
            ))
          ) : getFilteredMetaActivities().length > 0 ? (
          // Render activities 
          getFilteredMetaActivities().map(activity => (
            <MetaActivityCard
                key={activity._id}
                  activity={activity}
                  isSelected={selectedMetaActivities.has(activity._id)}
              isLoading={isLoadingAssignments[activity._id] || false}
              isPendingDeletion={activity._id === deletingActivityId}
              onSelect={() => toggleMetaActivitySelection(activity._id)}
              onManageStudents={() => handleManageStudents(activity)}
              onViewDetails={() => onViewDetails(activity)}
                />
            ))
          ) : (
          // Empty state with more instructive messaging
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
                {searchQuery ? (
                  <>
                <p className="text-sm font-medium">No matching activities</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-xs h-7"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
                  </>
                ) : (
                  <>
                <p className="text-sm font-medium">No activities available</p>
                <p className="text-xs text-muted-foreground mt-1">Activities will appear here when created</p>
                  </>
                )}
              </div>
          )}
      </div>
    </motion.div>
  );
} 