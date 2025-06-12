"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { KanbanView as PersonalViewBoard } from './PersonalViewBoard';
import { MetaActivitiesColumn } from './MetaActivitiesColumn';
import { BoardLevelMetaActivities } from './BoardLevelMetaActivities';
import { DifficultyLevel } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Layers, X, Filter, Search } from 'lucide-react';
import { Button, Badge } from '@intellect-kanban/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardLevelFilterBar } from './BoardLevelFilterBar';

interface ClassViewBoardProps {
  columns: Array<{ id: string; name: string; order?: number }>;
  boardId: string;
  
  // Drag and drop handlers
  draggingItem: string | null;
  draggingFromColumn: string | null;
  handleDragStart: (itemId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenDetail: (item: any) => void;
  deletingItemId: string | null;
  
  // Meta activities props
  metaActivities: any[];
  selectedMetaActivities: Set<string>;
  assignments: Record<string, any[]>;
  isLoadingAssignments: Record<string, boolean>;
  isLoadingActivities: boolean;
  
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
  
  // New props for MetaActivitiesColumn
  toggleMetaActivitySelection: (activityId: string) => Promise<void>;
  selectAllMetaActivities: () => Promise<void>;
  handleManageStudents: (activity: any) => void;
  onViewDetails: (activity: any) => void;
  metaActivitySearchQuery: string;
  setMetaActivitySearchQuery: (query: string) => void;
}

export function ClassViewBoard({
  columns,
  boardId,
  draggingItem,
  draggingFromColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenDetail,
  deletingItemId,
  metaActivities,
  selectedMetaActivities,
  assignments,
  isLoadingAssignments,
  isLoadingActivities,
  toggleMetaActivitySelection,
  selectAllMetaActivities,
  handleManageStudents,
  onViewDetails,
  metaActivitySearchQuery,
  setMetaActivitySearchQuery,
  
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
  uniqueStudents,
  uniqueTags,
  uniqueDifficultyLevels
}: ClassViewBoardProps) {
  const [currentMetaActivityIndex, setCurrentMetaActivityIndex] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
  
    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // State for on-board filters
  const [onBoardSelectedStudents, setOnBoardSelectedStudents] = useState<Set<string>>(new Set());
    
  // Check if we're on a mobile device
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const selectedMetaActivityIds = useMemo(() => {
    // Start with all activities that are checked in the sidebar
    let filteredActivities = metaActivities.filter(act => selectedMetaActivities.has(act._id));
  
    // Apply global tag filters
    if (selectedTagFilters.size > 0) {
        filteredActivities = filteredActivities.filter(act => {
            if (!act.tags || act.tags.length === 0) return false;
            const activityTagIds = new Set(act.tags.map((t: any) => t._id || t));
            return [...selectedTagFilters].some(filterTagId => activityTagIds.has(filterTagId));
        });
    }

    // Apply global difficulty filters
    if (selectedDifficultyFilters.size > 0) {
        filteredActivities = filteredActivities.filter(act => 
            act.difficultyLevel && selectedDifficultyFilters.has(act.difficultyLevel)
        );
    }
    
    // Apply global student filters
    if (selectedStudentFilters.size > 0) {
        filteredActivities = filteredActivities.filter(act => {
            const activityAssignments = assignments[act._id] || [];
            return activityAssignments.some(asm => selectedStudentFilters.has(asm.studentId?._id || asm.studentId));
      });
    }
    
    // Return just the IDs
    return filteredActivities.map(act => act._id);

  }, [
      metaActivities, 
      selectedMetaActivities, 
      selectedTagFilters, 
      selectedDifficultyFilters,
      selectedStudentFilters,
      assignments 
    ]);
  
  // Reset index if it's out of bounds after filtering
  useEffect(() => {
    if (currentMetaActivityIndex >= selectedMetaActivityIds.length) {
        setCurrentMetaActivityIndex(0);
    }
  }, [selectedMetaActivityIds, currentMetaActivityIndex]);

  const currentMetaActivity = useMemo(() => {
    if (selectedMetaActivityIds.length === 0) return null;
    const activityId = selectedMetaActivityIds[currentMetaActivityIndex];
    return metaActivities.find(act => act._id === activityId);
  }, [currentMetaActivityIndex, selectedMetaActivityIds, metaActivities]);

  // Get all assignments for the current meta activity
  const allCurrentBoardAssignments = useMemo(() => {
      if (!currentMetaActivity) return [];
      return assignments[currentMetaActivity._id] || [];
  }, [currentMetaActivity, assignments]);

  // Effect to log assignment updates for debugging
  useEffect(() => {
    if (currentMetaActivity && assignments[currentMetaActivity._id]) {
      console.log(`[ClassViewBoard] Assignments updated for activity ${currentMetaActivity._id}:`, 
        assignments[currentMetaActivity._id].length);
    }
  }, [assignments, currentMetaActivity]);

  // 2. Derive available filter options from the current board's content
  const onBoardStudentOptions = useMemo(() => {
    const studentMap = new Map<string, { _id: string; name: string }>();
    allCurrentBoardAssignments.forEach(a => {
      const student = a.studentId;
      if (student && student._id && !studentMap.has(student._id)) {
        studentMap.set(student._id, { _id: student._id, name: student.name });
    }
    });
    return Array.from(studentMap.values());
  }, [allCurrentBoardAssignments]);
  
  // Synchronize on-board filters with global filters
  useEffect(() => {
    // Intersect global student filters with students available on this board
    const availableStudents = new Set(onBoardStudentOptions.map(s => s._id));
    const newSelectedStudents = new Set(
        [...selectedStudentFilters].filter(id => availableStudents.has(id))
    );
    setOnBoardSelectedStudents(newSelectedStudents);
  }, [selectedStudentFilters, onBoardStudentOptions]);
  
  const currentAssignments = useMemo(() => {
    if (!currentMetaActivity) return {};

    // Start with all assignments for the current meta activity
    let activityAssignments = allCurrentBoardAssignments;

    // Apply ON-BOARD filters
    if (onBoardSelectedStudents.size > 0) {
        activityAssignments = activityAssignments.filter(a => onBoardSelectedStudents.has(a.studentId?._id || a.studentId));
    }

    const assignmentsByColumn: Record<string, any[]> = {};
    columns.forEach(c => assignmentsByColumn[c.id] = []);
    activityAssignments.forEach(a => {
      if (assignmentsByColumn[a.columnId]) {
        assignmentsByColumn[a.columnId].push(a);
      }
    });
    return assignmentsByColumn;
  }, [currentMetaActivity, allCurrentBoardAssignments, columns, metaActivities, onBoardSelectedStudents]);
  
  const isLoadingCurrentAssignments = useMemo(() => {
      if (!currentMetaActivity) return false;
      return isLoadingAssignments[currentMetaActivity._id] ?? false;
  }, [currentMetaActivity, isLoadingAssignments]);

  const goToNext = () => {
    setCurrentMetaActivityIndex(prev => (prev + 1) % selectedMetaActivityIds.length);
  };

  const goToPrevious = () => {
    setCurrentMetaActivityIndex(prev => (prev - 1 + selectedMetaActivityIds.length) % selectedMetaActivityIds.length);
  };

  const handleOnBoardStudentFilterChange = (studentId: string) => {
    setOnBoardSelectedStudents(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) newSet.delete(studentId);
        else newSet.add(studentId);
        return newSet;
    });
  };

  const clearOnBoardFilters = () => {
      setOnBoardSelectedStudents(new Set());
  }

  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);
  
  return (
    <div className="flex h-full w-full relative">
        {/* Mobile sidebar toggle button - fixed position when collapsed */}
        {isSidebarCollapsed && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute left-2 top-2 z-30 h-8 w-8 p-0 rounded-full shadow-md md:hidden"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        
        {/* Sidebar */}
        <motion.div
          className={`h-full bg-card ${isMobile ? 'fixed inset-0 z-20' : 'border-r'} ${isSidebarCollapsed && isMobile ? 'pointer-events-none' : ''}`}
          initial={false}
          animate={{
            width: isSidebarCollapsed ? (isMobile ? '0px' : '50px') : '320px',
            opacity: isSidebarCollapsed && isMobile ? 0 : 1
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
            <div className={`h-full ${isSidebarCollapsed ? 'overflow-hidden' : 'overflow-auto'}`}>
                {isSidebarCollapsed && !isMobile ? (
              <div className="h-full flex flex-col items-center justify-between py-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                      onClick={() => setIsSidebarCollapsed(false)}
                  className="rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            ) : (
                  <div className="flex flex-col h-full">
                    {/* Mobile header: title, search, filter, close */}
                    {isMobile && (
                      <div className="flex items-center p-3 border-b gap-2">
                        {/* Title or search input */}
                        {!showMobileSearch ? (
                          <h3 className="font-medium text-sm flex-1 truncate">Class Activities</h3>
                        ) : (
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={metaActivitySearchQuery}
                            onChange={e => setMetaActivitySearchQuery(e.target.value)}
                            onBlur={() => setShowMobileSearch(false)}
                            placeholder="Search activities..."
                            className="flex-1 h-8 px-3 rounded bg-muted text-sm border focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        )}
                        {/* Search icon */}
                        {!showMobileSearch && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 p-0"
                            onClick={() => setShowMobileSearch(true)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Filter button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0"
                          onClick={() => setIsStudentFilterOpen(true)}
                        >
                          <Filter className="h-4 w-4" />
                        </Button>
                        {/* Close button */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsSidebarCollapsed(true)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                <MetaActivitiesColumn
                  activities={metaActivities}
                  selectedMetaActivities={selectedMetaActivities}
                  isLoadingActivities={isLoadingActivities}
                  isLoadingAssignments={isLoadingAssignments}
                  deletingActivityId={deletingItemId || ''}
                  searchQuery={metaActivitySearchQuery}
                  setSearchQuery={setMetaActivitySearchQuery}
                  toggleMetaActivitySelection={toggleMetaActivitySelection}
                  selectAllMetaActivities={selectAllMetaActivities}
                  handleManageStudents={handleManageStudents}
                  onViewDetails={onViewDetails}
                  onCollapseColumn={() => setIsSidebarCollapsed(true)}
                  // Pass all filter props directly
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
                  uniqueStudents={uniqueStudents}
                  uniqueTags={uniqueTags}
                  uniqueDifficultyLevels={uniqueDifficultyLevels}
                  hideHeader={isMobile}
                  hideFilterButton={isMobile}
                />
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col h-full">
            {selectedMetaActivityIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 sm:p-8">
                    <Layers className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 text-muted-foreground/50" />
                    <h3 className="text-base sm:text-lg font-semibold">No Class Activities Selected</h3>
                    <p className="text-xs sm:text-sm mt-1 text-center">Select activities from the {isMobile ? "menu" : "left panel"} to view student assignments.</p>
                    
                    {/* Mobile-only button to open sidebar */}
                    {isMobile && isSidebarCollapsed && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsSidebarCollapsed(false)}
                        className="mt-4"
                      >
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Open Activities Menu
                      </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* Board header with meta activity name, pagination, and filter */}
                    {selectedMetaActivityIds.length > 0 && currentMetaActivity && (
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b relative">
                            {/* Mobile-only button to open sidebar - positioned absolutely */}
                            {isMobile && isSidebarCollapsed && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setIsSidebarCollapsed(false)}
                                    className="absolute left-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 z-10"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            )}
                            
                            <div className={`flex items-center gap-2 flex-1 min-w-0 ${isMobile && isSidebarCollapsed ? 'pl-8' : ''}`}>
                                <h3 
                                    className="text-lg font-semibold truncate" 
                                    title={currentMetaActivity.title}
                                >
                                    {currentMetaActivity.title}
                                </h3>
                                {currentMetaActivity.description && (
                                    <span className="text-xs text-muted-foreground hidden sm:inline">
                                        {currentMetaActivity.description}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Pagination controls */}
                                <div className="flex items-center gap-1 bg-muted/30 rounded-md border px-1.5 py-0.5">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                        onClick={goToPrevious}
                                        disabled={selectedMetaActivityIds.length <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <span className="sr-only">Previous</span>
                                    </Button>
                                    
                                    <span className="text-xs px-1">
                                        {selectedMetaActivityIds.length > 0 ? 
                                            `${currentMetaActivityIndex + 1} of ${selectedMetaActivityIds.length}` : 
                                            '0 of 0'}
                                    </span>
                                    
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 p-0"
                                        onClick={goToNext}
                                        disabled={selectedMetaActivityIds.length <= 1}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <span className="sr-only">Next</span>
                                    </Button>
                                </div>
                                
                                {/* Board-level filter button */}
                                <BoardLevelFilterBar
                                    studentOptions={onBoardStudentOptions}
                                    selectedStudents={onBoardSelectedStudents}
                                    onStudentFilterChange={handleOnBoardStudentFilterChange}
                                    onClearFilters={clearOnBoardFilters}
                                    compact={true}
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* Board content */}
                    <div className="flex-1 flex overflow-hidden">
                        <PersonalViewBoard
            columns={columns}
                            draggingItem={draggingItem}
                            draggingFromColumn={draggingFromColumn}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
                            handleOpenDetail={handleOpenDetail}
                            deletingItemId={deletingItemId}
                            items={currentAssignments}
                            itemType="assignment"
                            isLoading={isLoadingCurrentAssignments}
                            className="px-2 sm:px-0"
                        />
                    </div>
                </>
            )}
        </div>
        
        {/* Overlay backdrop for mobile */}
        {isMobile && !isSidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/20 z-10"
            onClick={() => setIsSidebarCollapsed(true)}
          />
        )}
    </div>
  );
} 