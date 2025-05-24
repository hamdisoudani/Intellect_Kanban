"use client";

import { Badge } from '@intellect-kanban/ui';
import { DifficultyLevel, difficultyLevelLabels, difficultyLevelColors } from '@/types/activities';
import { cn } from '@intellect-kanban/utils';

interface DifficultyBadgeProps {
  difficultyLevel: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DifficultyBadge({ 
  difficultyLevel = DifficultyLevel.DEVELOPING, 
  size = 'md',
  className 
}: DifficultyBadgeProps) {
  const label = difficultyLevelLabels[difficultyLevel] || 'Developing';
  const color = difficultyLevelColors[difficultyLevel] || '#3B82F6';
  
  // Size variant classes
  const sizeClasses = {
    sm: 'text-[10px] py-0 px-1.5 h-4',
    md: 'text-xs py-0.5 px-2 h-5',
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
  
  const textColor = getTextColor(color);
  
  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        "rounded-full font-medium border-opacity-30",
        className
      )}
      style={{
        backgroundColor: `${color}20`,  // 20% opacity
        borderColor: color,
        color: color
      }}
    >
      {label}
    </Badge>
  );
} 