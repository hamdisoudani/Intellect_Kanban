"use client";

import { KanbanRegularColumn } from './KanbanRegularColumn';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useMediaQuery } from '@intellect-kanban/utils';

interface KanbanViewProps {
  columns: Array<{ id: string; name: string; order?: number }>;
  items: Record<string, any[]>;
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
  className?: string;
}

export function KanbanView({
  columns,
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
  className
}: KanbanViewProps) {
  // Responsive columns based on screen size
  const isSmall = useMediaQuery('(max-width: 640px)');
  const isMedium = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isLarge = useMediaQuery('(min-width: 1025px) and (max-width: 1280px)');
  const isXLarge = useMediaQuery('(min-width: 1281px)');
  
  // Animation variants for columns
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    }),
    exit: { opacity: 0, y: -10 }
  };
  
  // Responsive layout calculation
  const getGridColumns = () => {
    if (isSmall) return 1; // Mobile: stack columns vertically
    if (isMedium) return 2; // Tablet: 2 columns per row
    if (isLarge) return 3; // Small desktop: 3 columns per row
    if (isXLarge) return 4; // Large desktop: 4 columns per row
    return 3; // Default fallback
  };
  
  // Layout style
  const gridStyle = useMemo(() => {
    const cols = getGridColumns();
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: isSmall ? '0.5rem' : '1rem',
      width: '100%',
      height: '100%',
      paddingTop: isSmall ? '0.5rem' : '0',
      paddingBottom: isSmall ? '0.5rem' : '1rem',
      paddingLeft: isSmall ? '0.5rem' : '0',
      paddingRight: isSmall ? '0.5rem' : '0'
    };
  }, [getGridColumns, isSmall]);
  
  return (
    <div className={`w-full h-full ${className || ''}`}>
      <AutoSizer>
        {({ height, width }) => (
          <div style={{ height, width, overflow: 'auto' }}>
            <div style={gridStyle}>
              {columns.map((column, index) => (
                <motion.div
                  key={column.id}
                  variants={columnVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  className="h-full"
                >
                  <KanbanRegularColumn
                    key={column.id}
                    column={column}
                    items={items[column.id] || []}
                    itemType={itemType}
                    isLoading={isLoading}
                    draggingItem={draggingItem}
                    draggingFromColumn={draggingFromColumn}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDrop={handleDrop}
                    handleOpenDetail={handleOpenDetail}
                    deletingItemId={deletingItemId}
                    onAddItem={onAddItem}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AutoSizer>
    </div>
  );
} 

export { KanbanView as PersonalViewBoard }; 