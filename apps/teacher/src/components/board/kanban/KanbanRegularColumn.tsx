"use client";

import { useState, useMemo } from 'react';
import { Button, Badge } from '@intellect-kanban/ui';
import { Filter, X, UsersIcon, TagIcon, AlertCircle, ChevronUp, ChevronDown, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanActivityCard } from '../KanbanActivityCard';
import { Skeleton } from '@intellect-kanban/ui';

interface KanbanRegularColumnProps {
  column: { id: string; name: string; order?: number };
  items: any[];
  itemType: 'activity' | 'assignment';
  isLoading: boolean;
  draggingItem: string | null;
  draggingFromColumn: string | null;
  handleDragStart: (itemId: string, columnId: string) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDrop: (e: React.DragEvent, columnId: string) => void;
  handleOpenDetail: (item: any) => void;
  deletingItemId: string | null;
  onAddItem?: (columnId: string) => void;
  hideActivityTitle?: boolean;

  // Class view specific props
  allAssignments?: any[];
  isMetaColumnCollapsed?: boolean;
  
  // Filter related props
  selectedStudentFilters?: Set<string>;
  selectedTagFilters?: Set<string>;
  selectedDifficultyFilters?: Set<any>;
  selectedActivityFilters?: Set<string>;
  clearAllFilters?: () => void;
}

export function KanbanRegularColumn({
  column,
  items,
  itemType,
  isLoading,
  draggingItem,
  draggingFromColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleOpenDetail,
  deletingItemId,
  onAddItem,
  hideActivityTitle = false,
  
  // Class view specific props
  allAssignments = [],
  isMetaColumnCollapsed,
  
  // Filter related props
  selectedStudentFilters = new Set<string>(),
  selectedTagFilters = new Set<string>(),
  selectedDifficultyFilters = new Set<any>(),
  selectedActivityFilters = new Set<string>(),
  clearAllFilters = () => {},
}: KanbanRegularColumnProps) {
  // Check if any filters are active
  const hasActiveFilters = selectedStudentFilters.size > 0 || 
                           selectedTagFilters.size > 0 || 
                           selectedDifficultyFilters.size > 0 ||
                           selectedActivityFilters.size > 0;

  // Get the appropriate count for the column badge
  const getColumnBadgeCount = () => {
    return items.length;
  };
  
  return (
    <div className="flex flex-col h-full bg-card border rounded-lg overflow-hidden">
      {/* Column Header */}
      <div className="p-2 sm:p-3 border-b bg-muted/30 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm">{column.name}</span>
          <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-muted/40">
            {items.length}
          </Badge>
          
          {/* Filter badges in class view */}
          {itemType === 'assignment' && hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 ml-1"
            >
              {/* Compact filter indicator that shows total count instead of individual badges */}
              <Badge variant="outline" className="bg-muted/30 px-1.5 h-5 text-[10px] flex items-center gap-1" title="Active filters">
                <Filter className="h-2.5 w-2.5" />
                {selectedStudentFilters.size + selectedTagFilters.size + selectedDifficultyFilters.size + selectedActivityFilters.size}
              </Badge>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 flex-shrink-0" 
                onClick={clearAllFilters}
                title="Clear filters"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Clear filters</span>
              </Button>
            </motion.div>
          )}
        </div>
          
          {/* Add activity button in personal view */}
          {itemType === 'activity' && onAddItem && (
          <Button 
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full flex-shrink-0"
              onClick={() => onAddItem(column.id)}
            >
            <Plus className="h-3.5 w-3.5" />
            <span className="sr-only">Add activity</span>
          </Button>
          )}
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-2 min-h-[100px]">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
            </div>
        )}
        
        {/* Render activities */}
        {!isLoading && itemType === 'activity' && (
          items.length > 0 ? (
            items.map(activity => (
            <KanbanActivityCard 
                key={activity._id}
                item={activity}
            itemType="activity"
                columnId={column.id}
            onClick={handleOpenDetail}
                isPendingDeletion={deletingItemId === activity._id}
                hideActivityTitle={false}
            onDragStart={(e, draggedItem) => {
              handleDragStart(draggedItem._id, column.id);
              e.dataTransfer.setData('text/plain', draggedItem._id);
              }}
            />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-center p-3 border border-dashed border-border/50 rounded-lg bg-muted/5">
              <div className="text-muted-foreground text-xs mb-2">No activities</div>
              {onAddItem && (
                <button 
                  onClick={() => onAddItem(column.id)} 
                  className="text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md px-2.5 py-1 transition-colors"
                >
                  Add activity
                </button>
              )}
            </div>
          )
        )}
        
        {/* Render assignments */}
        {!isLoading && itemType === 'assignment' && (
          items.length > 0 ? (
            items.map(assignment => (
              <KanbanActivityCard
                            key={assignment._id} 
                item={assignment}
                itemType="assignment"
                columnId={column.id}
                onClick={handleOpenDetail}
                isPendingDeletion={deletingItemId === assignment._id}
                hideActivityTitle={hideActivityTitle}
                onDragStart={(e, draggedItem) => {
                  handleDragStart(draggedItem._id, column.id);
                  e.dataTransfer.setData('text/plain', draggedItem._id);
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-center p-3 border border-dashed border-border/50 rounded-lg bg-muted/5">
              <div className="text-muted-foreground text-xs mb-1">
                {hasActiveFilters ? (
                  <>
                    <span className="font-medium text-primary">Filtered view:</span> No matching assignments
                  </>
                ) : (
                  <>
                    No assignments in <span className="font-medium">{column.name}</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {hasActiveFilters ? (
                  <>Try adjusting your filters</>
                ) : (
                  <>Drag assignments here to update their status</>
                )}
              </div>
                </div>
          )
        )}
      </div>
    </div>
  );
}