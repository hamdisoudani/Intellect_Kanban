"use client";

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@intellect-kanban/ui';
import { ClassPerformance } from '@/utils/types';
import { motion } from 'framer-motion';

interface ClassPerformanceTableProps {
  data: ClassPerformance[];
}

export function ClassPerformanceTable({ data }: ClassPerformanceTableProps) {
  const columns = useMemo<ColumnDef<ClassPerformance>[]>(() => [
    {
      accessorKey: 'className',
      header: 'Class Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('className')}</div>
      ),
    },
    {
      accessorKey: 'studentCount',
      header: 'Students',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('studentCount')}</div>
      ),
    },
    {
      accessorKey: 'boardCount',
      header: 'Boards',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('boardCount')}</div>
      ),
    },
    {
      accessorKey: 'totalAssignments',
      header: 'Total Assignments',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('totalAssignments')}</div>
      ),
    },
    {
      accessorKey: 'completedAssignments',
      header: 'Completed',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('completedAssignments')}</div>
      ),
    },
    {
      accessorKey: 'completionPercentage',
      header: 'Progress',
      cell: ({ row }) => {
        const percentage = row.getValue('completionPercentage') as number;
        return (
          <div className="flex items-center gap-2">
            <div className="w-full bg-muted/20 h-2 rounded-full overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{percentage}%</span>
          </div>
        );
      },
    },
  ], []);

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      showToolbar={false} 
      showPagination={false}
      className="overflow-hidden"
    />
  );
} 