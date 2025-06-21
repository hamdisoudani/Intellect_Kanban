"use client";

import { Badge } from '@intellect-kanban/ui';
import { cn } from '@intellect-kanban/utils';

interface TagBadgeProps {
  label: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TagBadge({ 
  label,
  color,
  size = 'md',
  className 
}: TagBadgeProps) {
  // Size variant classes
  const sizeClasses = {
    sm: 'text-[10px] py-0 px-1.5 h-4',
    md: 'text-xs py-0.5 px-3 h-[26px]',
    lg: 'text-sm py-1 px-2.5 h-6'
  };
  
  // Calculate text color based on background color brightness
  const getTextColor = (bgColor: string) => {
    // Remove # if present
    const hex = bgColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Return white for dark colors, black for light colors
    return brightness < 128 ? 'text-white' : 'text-black';
  };
  
  // Default to a primary color if none provided
  const safeColor = color || '#6366F1';
  
  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        "rounded-full font-medium border-opacity-30 flex items-center",
        className
      )}
      style={{
        backgroundColor: `${safeColor}20`,  // 20% opacity
        borderColor: safeColor,
        color: safeColor
      }}
    >
      {label}
    </Badge>
  );
} 