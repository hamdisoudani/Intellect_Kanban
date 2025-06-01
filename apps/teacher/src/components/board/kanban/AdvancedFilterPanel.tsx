"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, Checkbox, Avatar, AvatarFallback, Tabs, TabsContent, TabsList, TabsTrigger, Input } from '@intellect-kanban/ui';
import { Filter, UsersIcon, Search, X, Tag as TagIcon, AlertCircle, Layers } from 'lucide-react';
import { DifficultyLevel } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';
import { StudentOption } from '@/utils/types';

interface AdvancedFilterPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudentFilters: Set<string>;
  tempStudentFilters: Set<string>;
  setTempStudentFilters: (filters: Set<string>) => void;
  selectedTagFilters: Set<string>;
  tempTagFilters: Set<string>;
  setTempTagFilters: (filters: Set<string>) => void;
  selectedDifficultyFilters: Set<DifficultyLevel>;
  tempDifficultyFilters: Set<DifficultyLevel>;
  setTempDifficultyFilters: (filters: Set<DifficultyLevel>) => void;
  selectedActivityFilters?: Set<string>;
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
  applyFilters: () => void;
  clearFilters: () => void;
  uniqueStudents: { _id: string; name: string }[];
  uniqueTags: TagType[];
  uniqueDifficultyLevels: { level: DifficultyLevel, label: string, color: string }[];
  selectedMetaActivities?: Set<string>;
  metaActivities?: any[];
}

export function AdvancedFilterPanel({
  isOpen,
  onOpenChange,
  selectedStudentFilters,
  tempStudentFilters,
  setTempStudentFilters,
  selectedTagFilters,
  tempTagFilters,
  setTempTagFilters,
  selectedDifficultyFilters,
  tempDifficultyFilters,
  setTempDifficultyFilters,
  selectedActivityFilters = new Set<string>(),
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
  applyFilters,
  clearFilters,
  uniqueStudents,
  uniqueTags,
  uniqueDifficultyLevels,
  selectedMetaActivities = new Set<string>(),
  metaActivities = []
}: AdvancedFilterPanelProps) {
  // Track if we have any activities to filter
  const hasActivitiesToFilter = selectedMetaActivities.size > 0;
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => {
      // When opening the dropdown, initialize temp filters with current selection
      if (open) {
        setTempStudentFilters(new Set(selectedStudentFilters));
        setTempTagFilters(new Set(selectedTagFilters));
        setTempDifficultyFilters(new Set(selectedDifficultyFilters));
        setTempActivityFilters(new Set(selectedActivityFilters));
      } else {
        // Reset search query when closing
        setStudentSearchQuery('');
        setTagSearchQuery('');
        if (setActivitySearchQuery) {
          setActivitySearchQuery('');
        }
      }
      onOpenChange(open);
    }}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 relative"
        >
          <Filter className="h-4 w-4" />
          {(selectedStudentFilters.size > 0 || 
            selectedTagFilters.size > 0 || 
            selectedDifficultyFilters.size > 0 ||
            selectedActivityFilters.size > 0) && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-primary text-[10px] text-primary-foreground rounded-full h-4 w-4 flex items-center justify-center"
            >
              {selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size + selectedActivityFilters.size}
            </motion.span>
          )}
          <span className="sr-only">Advanced filters</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" className="w-[350px] p-0 border-none shadow-lg rounded-lg" sideOffset={5}>
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg overflow-hidden"
        >
          <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
            <h4 className="font-medium text-sm">Filter Activities</h4>
            <Badge variant="outline" className="font-normal text-xs">
              {selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size + selectedActivityFilters.size} active
            </Badge>
          </div>
          
          <Tabs 
            value={activeFilterTab} 
            onValueChange={(value) => setActiveFilterTab(value as 'students' | 'tags' | 'difficulty' | 'activities')} 
            className="w-full"
          >
            <div className="border-b overflow-x-auto">
              <TabsList className="w-full h-auto px-1.5 bg-transparent border-b rounded-none">
                {hasActivitiesToFilter && (
                  <TabsTrigger 
                    value="activities" 
                    className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Activities</span>
                      {selectedActivityFilters.size > 0 && (
                        <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                          {selectedActivityFilters.size}
                        </span>
                      )}
                    </div>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="students" 
                  className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>Students</span>
                    {selectedStudentFilters.size > 0 && (
                      <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                        {selectedStudentFilters.size}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="tags" 
                  className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>Tags</span>
                    {selectedTagFilters.size > 0 && (
                      <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                        {selectedTagFilters.size}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="difficulty" 
                  className="flex-1 py-2 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Difficulty</span>
                    {selectedDifficultyFilters.size > 0 && (
                      <span className="bg-primary/15 text-[10px] rounded-full px-1.5 py-0.5">
                        {selectedDifficultyFilters.size}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Activities tab content */}
            <TabsContent value="activities" className="p-3 focus-visible:outline-none focus-visible:ring-0">
              {/* Search input for activities */}
              <div className="mb-3 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={activitySearchQuery}
                  onChange={(e) => setActivitySearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {/* Show selected meta activities */}
                {selectedMetaActivities.size > 0 ? (
                  <div className="divide-y">
                    {/* Select All option */}
                    <div className="p-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="activity-filter-select-all" 
                          checked={tempActivityFilters.size === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Show all activities (empty set = show all)
                              setTempActivityFilters(new Set());
                            } else {
                              // Hide all activities (select none)
                              // We use a special case where we add a non-existent ID to indicate "hide all"
                              setTempActivityFilters(new Set(['__hide_all__']));
                            }
                          }}
                        />
                        <label 
                          htmlFor="activity-filter-select-all" 
                          className="text-xs font-medium cursor-pointer"
                        >
                          Show All Activities
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-1">
                      {Array.from(selectedMetaActivities)
                        .filter(activityId => {
                          // Filter by search query if provided
                          if (!activitySearchQuery) return true;
                          const activity = metaActivities.find(a => a._id === activityId);
                          if (!activity) return false;
                          return activity.title.toLowerCase().includes(activitySearchQuery.toLowerCase());
                        })
                        .map(activityId => {
                          // Find activity details
                          const activity = metaActivities.find(a => a._id === activityId);
                          if (!activity) return null;
                          
                          const activityTitle = activity.title || "Untitled Activity";
                          
                          // Activity is checked if filter is empty (show all) OR if this specific ID is in the filter
                          const isChecked = tempActivityFilters.size === 0 || 
                            (tempActivityFilters.size > 0 && !tempActivityFilters.has('__hide_all__') && tempActivityFilters.has(activityId));
                          
                          return (
                            <div key={activityId} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded mb-1">
                              <Checkbox 
                                id={`activity-filter-${activityId}`} 
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  let newFilters = new Set(tempActivityFilters);
                                  
                                  // If filter was empty (show all) and we're unchecking an item
                                  if (tempActivityFilters.size === 0 && !checked) {
                                    // Add all IDs except the one being unchecked
                                    Array.from(selectedMetaActivities).forEach(id => {
                                      if (id !== activityId) {
                                        newFilters.add(id);
                                      }
                                    });
                                  }
                                  // If we had the special "hide all" marker, remove it
                                  else if (newFilters.has('__hide_all__')) {
                                    newFilters = new Set([activityId]);
                                  }
                                  // Normal case: toggle the activity ID
                                  else {
                                    if (checked) {
                                      newFilters.add(activityId);
                                    } else {
                                      newFilters.delete(activityId);
                                    }
                                  }
                                  
                                  // If all activities are selected, use empty set (show all)
                                  if (newFilters.size === selectedMetaActivities.size) {
                                    setTempActivityFilters(new Set());
                                  } else {
                                    setTempActivityFilters(newFilters);
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`activity-filter-${activityId}`} 
                                className="text-xs cursor-pointer flex items-center gap-2 w-full"
                              >
                                <span className="truncate">{activityTitle}</span>
                              </label>
                            </div>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No activities selected
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Students tab content */}
            <TabsContent value="students" className="p-3 focus-visible:outline-none focus-visible:ring-0">
              {/* Search input for students */}
              <div className="mb-3 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {/* Get all unique students from selected activities */}
                {uniqueStudents.length > 0 ? (
                  <div className="divide-y">
                    {/* Select All option */}
                    <div className="p-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="student-filter-select-all" 
                          checked={tempStudentFilters.size === uniqueStudents.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Select all students
                              const allIds = new Set(uniqueStudents.map(s => s._id));
                              setTempStudentFilters(allIds);
                            } else {
                              // Clear all selections
                              setTempStudentFilters(new Set());
                            }
                          }}
                        />
                        <label 
                          htmlFor="student-filter-select-all" 
                          className="text-xs font-medium cursor-pointer"
                        >
                          Select All
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-1">
                      {uniqueStudents
                        .filter(student => 
                          !studentSearchQuery || 
                          student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
                        )
                        .map(student => (
                          <div key={student._id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                            <Checkbox 
                              id={`student-filter-${student._id}`} 
                              checked={tempStudentFilters.has(student._id)}
                              onCheckedChange={(checked) => {
                                const newFilters = new Set(tempStudentFilters);
                                if (checked) {
                                  newFilters.add(student._id);
                                } else {
                                  newFilters.delete(student._id);
                                }
                                setTempStudentFilters(newFilters);
                              }}
                            />
                            <label 
                              htmlFor={`student-filter-${student._id}`} 
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">
                                  {student.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{student.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No students available
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Tags tab content */}
            <TabsContent value="tags" className="p-3 focus-visible:outline-none focus-visible:ring-0">
              {/* Search input for tags */}
              <div className="mb-3 relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-7 h-7 text-xs"
                />
              </div>
              
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {/* Get all unique tags */}
                {uniqueTags.length > 0 ? (
                  <div className="divide-y">
                    {/* Select All option */}
                    <div className="p-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="tag-filter-select-all" 
                          checked={tempTagFilters.size === uniqueTags.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Select all tags
                              const allIds = new Set(uniqueTags.map(t => t._id));
                              setTempTagFilters(allIds);
                            } else {
                              // Clear all selections
                              setTempTagFilters(new Set());
                            }
                          }}
                        />
                        <label 
                          htmlFor="tag-filter-select-all" 
                          className="text-xs font-medium cursor-pointer"
                        >
                          Select All
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-1">
                      {uniqueTags
                        .filter(tag => 
                          !tagSearchQuery || 
                          tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
                        )
                        .map(tag => (
                          <div key={tag._id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                            <Checkbox 
                              id={`tag-filter-${tag._id}`} 
                              checked={tempTagFilters.has(tag._id)}
                              onCheckedChange={(checked) => {
                                const newFilters = new Set(tempTagFilters);
                                if (checked) {
                                  newFilters.add(tag._id);
                                } else {
                                  newFilters.delete(tag._id);
                                }
                                setTempTagFilters(newFilters);
                              }}
                            />
                            <label 
                              htmlFor={`tag-filter-${tag._id}`} 
                              className="text-xs cursor-pointer flex items-center gap-2"
                            >
                              <span 
                                className="h-3 w-3 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: tag.color }}
                              ></span>
                              <span className="truncate">{tag.name}</span>
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No tags available
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Difficulty tab content */}
            <TabsContent value="difficulty" className="p-3 focus-visible:outline-none focus-visible:ring-0">
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {uniqueDifficultyLevels.length > 0 ? (
                  <div className="divide-y">
                    {/* Select All option */}
                    <div className="p-2 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="difficulty-filter-select-all" 
                          checked={tempDifficultyFilters.size === uniqueDifficultyLevels.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Select all difficulty levels
                              const allLevels = new Set(uniqueDifficultyLevels.map(d => d.level));
                              setTempDifficultyFilters(allLevels);
                            } else {
                              // Clear all selections
                              setTempDifficultyFilters(new Set());
                            }
                          }}
                        />
                        <label 
                          htmlFor="difficulty-filter-select-all" 
                          className="text-xs font-medium cursor-pointer"
                        >
                          Select All
                        </label>
                      </div>
                    </div>
                    
                    <div className="p-1">
                      {uniqueDifficultyLevels.map(difficulty => (
                        <div key={difficulty.level} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded">
                          <Checkbox 
                            id={`difficulty-filter-${difficulty.level}`} 
                            checked={tempDifficultyFilters.has(difficulty.level)}
                            onCheckedChange={(checked) => {
                              const newFilters = new Set(tempDifficultyFilters);
                              if (checked) {
                                newFilters.add(difficulty.level);
                              } else {
                                newFilters.delete(difficulty.level);
                              }
                              setTempDifficultyFilters(newFilters);
                            }}
                          />
                          <label 
                            htmlFor={`difficulty-filter-${difficulty.level}`} 
                            className="text-xs cursor-pointer flex items-center gap-2"
                          >
                            <span 
                              className="h-3 w-3 rounded flex-shrink-0" 
                              style={{ backgroundColor: difficulty.color }}
                            ></span>
                            <span className="truncate">{difficulty.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No difficulty levels available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-3 border-t bg-muted/10 flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearFilters}
              disabled={tempStudentFilters.size === 0 && tempTagFilters.size === 0 && tempDifficultyFilters.size === 0 && tempActivityFilters.size === 0}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={applyFilters}
                className="h-7 text-xs px-5"
              >
                Apply
              </Button>
            </div>
          </div>
        </motion.div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 