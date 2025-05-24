"use client";

import { Badge } from '@intellect-kanban/ui';

interface PriorityBadgeProps {
  priority: string;
  showText?: boolean;
}

export function PriorityBadge({ priority, showText = true }: PriorityBadgeProps) {
  // Get priority badge styling
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Badge className={getPriorityColor(priority)}>
      {showText ? `${priority} Priority` : priority}
    </Badge>
  );
} 