"use client";

import { cn } from "@intellect-kanban/utils";
import { X } from "lucide-react";
import { HTMLAttributes } from "react";

interface TagProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  color?: string;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function Tag({ 
  label, 
  color = "#6366F1",
  onRemove, 
  size = 'md', 
  className, 
  ...props 
}: TagProps) {
  // Calculate text color based on background color brightness
  const getTextColor = (bgColor: string = "#6366F1") => {
    // If color is undefined or invalid, use default
    if (!bgColor) {
      bgColor = "#6366F1";
    }

    // Remove # if present
    const hex = bgColor.replace('#', '');
    
    // Validate hex string - if invalid, return white text
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return 'text-white';
    }
    
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
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2 rounded-full',
    md: 'text-sm py-1 px-3 rounded-full',
    lg: 'text-base py-1.5 px-3.5 rounded-full'
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 font-medium animate-in fade-in zoom-in duration-200",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      <span className={textColor}>{label}</span>
      
      {onRemove && (
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "hover:opacity-80 active:scale-95 transition-all flex items-center justify-center",
            textColor
          )}
          aria-label={`Remove ${label} tag`}
        >
          <X size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
} 