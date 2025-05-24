"use client"

import * as React from 'react'
import { cn } from '@intellect-kanban/utils'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'archived' | string;
}

/**
 * StatusBadge component for displaying status indicators with semantic coloring
 */
export function StatusBadge({ 
  status, 
  className, 
  children,
  ...props 
}: StatusBadgeProps) {
  // Determine color based on status
  const getColorClasses = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        getColorClasses(),
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
} 
