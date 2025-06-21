"use client";

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';
import { Board, Column } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { Columns, Calendar, ArrowRight, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface BoardsTableProps {
  boards: Board[];
  isLoading?: boolean;
}

export function BoardsTable({ boards, isLoading = false }: BoardsTableProps) {
  const router = useRouter();
  
  const handleOpenBoard = (boardId: string) => {
    router.push(`/dashboard/board/${boardId}`);
  };

  // Get a simplified date format
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  const columns = useMemo<ColumnDef<Board>[]>(() => [
    {
      accessorKey: "name",
      header: "Board Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Columns className="text-primary h-4 w-4" />
          </div>
          <div>
            <div className="font-medium truncate max-w-[180px]" title={row.original.name}>
              {row.original.name}
            </div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[220px]" title={row.original.description}>
                {row.original.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: "columns",
      header: "Columns",
      cell: ({ row }) => {
        const columns = row.original.columns;
        return (
          <div className="flex flex-wrap gap-1.5 py-1">
            {columns.slice(0, 3).map((column: Column) => (
              <Badge 
                key={column.id}
                variant="secondary"
                className="text-xs px-1.5 py-0"
              >
                {column.name}
              </Badge>
            ))}
            {columns.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                +{columns.length - 3} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created Date",
      size: 160,
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar size={15} className="flex-shrink-0" />
            <span>{getFormattedDate(row.original.createdAt)}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center gap-1 w-[100px]"
                  onClick={() => handleOpenBoard(row.original._id)}
                >
                  <span>Open</span>
                  <ArrowRight size={14} className="ml-1 flex-shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open Kanban Board</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
  ], []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted/5">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-t-primary/80 rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading boards...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (boards.length === 0) {
    return (
      <motion.div 
        className="text-center p-12 border rounded-lg bg-muted/5 border-border/40 border-dashed shadow-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <LayoutGrid className="text-primary h-7 w-7" />
        </div>
        <h3 className="text-xl font-medium mb-2">No Kanban Boards</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first board to start organizing activities for this class.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full overflow-auto">
        <DataTable
          columns={columns}
          data={boards}
          searchKey="name"
          searchPlaceholder="Search boards..."
          className="overflow-hidden"
          showColumnToggle={true}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 15, 20]}
        />
      </div>
    </motion.div>
  );
} 