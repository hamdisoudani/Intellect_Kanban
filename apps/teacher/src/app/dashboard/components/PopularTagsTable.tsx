"use client";

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable, Badge } from '@intellect-kanban/ui';
import { TagUsage } from '@/utils/types';
import { motion } from 'framer-motion';

interface PopularTagsTableProps {
  data: TagUsage[];
}

export function PopularTagsTable({ data }: PopularTagsTableProps) {
  const columns = useMemo<ColumnDef<TagUsage>[]>(() => [
    {
      accessorKey: 'tagName',
      header: 'Tag Name',
      cell: ({ row }) => {
        const tagName = row.getValue('tagName') as string;
        // Simple hashing for color variety.
        const colorClass = `bg-blue-200 text-blue-800`;
        return (
          <Badge variant="outline" className={colorClass}>
            {tagName}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'count',
      header: 'Times Used',
      cell: ({ row }) => (
        <div className="text-center font-semibold">{row.getValue('count')}</div>
      ),
    }
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