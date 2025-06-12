"use client";

import { useState, useMemo } from 'react';
import { Button, Badge } from '@intellect-kanban/ui';
import { Filter, X, UsersIcon, TagIcon, AlertCircle, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { KanbanActivityCard } from '../KanbanActivityCard';

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
    <div 
      className={`flex flex-col h-full border rounded-lg overflow-hidden bg-card shadow-sm w-full ${
        itemType === 'activity' 
          ? '' 
          : isMetaColumnCollapsed 
            ? 'flex-1' 
            : ''
      }`}
      onDragOver={(e) => handleDragOver(e, column.id)}
      onDrop={(e) => handleDrop(e, column.id)}
      style={{ minWidth: 0 }}
    >
      {/* Column Header - more responsive version */}
      <div className="p-2 border-b bg-muted/30 flex flex-wrap items-center justify-between gap-1 min-h-[48px]">
        <div className="flex items-center flex-wrap gap-1 min-w-0 max-w-full pr-1">
          <span className="font-medium truncate">{column.name}</span>
          <Badge variant="outline" className="text-xs bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
            {getColumnBadgeCount()}
          </Badge>
          
          {/* Show filtered vs total count when filters are active in class view */}
          {itemType === 'assignment' && hasActiveFilters && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {items.length}/{allAssignments.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
          {/* Filter badges in class view */}
          {itemType === 'assignment' && hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
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
          
          {/* Add activity button in personal view */}
          {itemType === 'activity' && onAddItem && (
            <button 
              className="text-xs text-muted-foreground hover:text-foreground p-1 rounded flex-shrink-0"
              onClick={() => onAddItem(column.id)}
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-2 pb-6 overflow-y-auto w-full" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {/* Loading Skeletons */}
        {isLoading && (
          Array(3).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`} className="rounded-md border p-2 animate-pulse mb-3">
              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded mb-2"></div>
              <div className="flex justify-between items-center">
                <div className="h-3 w-1/4 bg-muted-foreground/15 rounded"></div>
                <div className="h-3 w-1/6 bg-muted-foreground/15 rounded"></div>
              </div>
            </div>
          ))
        )}
        
        {/* Render activities */}
        {!isLoading && itemType === 'activity' && items.map((item) => (
            <KanbanActivityCard 
            key={item._id}
            item={item}
            itemType="activity"
            onClick={handleOpenDetail}
            isPendingDeletion={deletingItemId === item._id}
            isMetaActivity={item.type === 'meta'}
            onDragStart={(e, draggedItem) => {
              if (draggedItem.type === 'meta') return;
              handleDragStart(draggedItem._id, column.id);
              e.dataTransfer.setData('text/plain', draggedItem._id);
              }}
            />
        ))}
        
        {/* Render assignments */}
        {!isLoading && itemType === 'assignment' && (
          items.length > 0 ? (
            items.map(assignment => (
              <KanbanActivityCard
                            key={assignment._id} 
                item={assignment}
                itemType="assignment"
                onClick={handleOpenDetail}
                isPendingDeletion={deletingItemId === assignment._id}
                onDragStart={(e, draggedItem) => {
                  handleDragStart(draggedItem._id, column.id);
                  e.dataTransfer.setData('text/plain', draggedItem._id);
                }}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-4 text-center">
              {hasActiveFilters ? "No assignments match filters" : "No assignments in this column"}
                </div>
          )
        )}
      </div>
    </div>
  );
}