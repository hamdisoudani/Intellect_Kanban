"use client";

import { useMemo } from 'react';
import { Card, Badge } from '@intellect-kanban/ui';
import { UsersIcon, CheckSquare, Square, Tag as TagIcon, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tag as TagUI } from '../ui/Tag';
import { useTags } from '@/hooks/useTags';
import { Tag as TagType } from '@/types/tags';
import { Activity } from '@/types/activities';
import { DifficultyBadge } from './DifficultyBadge';
import { DifficultyLevel } from '@/types/activities';
import { cn } from '@intellect-kanban/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@intellect-kanban/ui';

interface MetaActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  isLoading: boolean;
  onSelect: (activityId: string) => void;
  isPendingDeletion?: boolean;
}

export function MetaActivityCard({
  activity,
  isSelected,
  isLoading,
  onSelect,
  isPendingDeletion = false,
}: MetaActivityCardProps) {
  // Memoize resolved tags to prevent re-computation
  const resolvedTags = useMemo(() => {
    if (!activity.tags || activity.tags.length === 0) return [];
    // Assuming tags are populated correctly from the backend
    return activity.tags as unknown as TagType[];
  }, [activity.tags]);

  // Memoize difficulty (for future extensibility)
  const resolvedDifficulties: string[] = useMemo(() => {
    if (!activity.difficultyLevel) return [];
    if (Array.isArray(activity.difficultyLevel)) {
      return activity.difficultyLevel.filter(Boolean);
    }
    return [activity.difficultyLevel];
  }, [activity.difficultyLevel]);

  // Handle card click for selection
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !isPendingDeletion) {
      onSelect(activity._id);
    }
  };

  const assignedCount = activity.assignedStudents?.length || 0;

  // Tag display logic
  const MAX_TAGS = 2;
  const { displayTags, remainingTags } = useMemo(() => {
    const tags = resolvedTags;
    if (tags.length > MAX_TAGS) {
      return {
        displayTags: tags.slice(0, MAX_TAGS),
        remainingTags: tags.slice(MAX_TAGS),
      };
    }
    return { displayTags: tags, remainingTags: [] };
  }, [resolvedTags]);

  // Difficulty display logic (for future extensibility)
  const MAX_DIFFICULTY = 1;
  const { displayDifficulties, remainingDifficulties } = useMemo(() => {
    if (resolvedDifficulties.length > MAX_DIFFICULTY) {
      return {
        displayDifficulties: resolvedDifficulties.slice(0, MAX_DIFFICULTY),
        remainingDifficulties: resolvedDifficulties.slice(MAX_DIFFICULTY),
      };
    }
    return { displayDifficulties: resolvedDifficulties, remainingDifficulties: [] };
  }, [resolvedDifficulties]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Overlays for loading and deletion states */}
      {(isLoading || isPendingDeletion) && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 rounded-full border-2 ${isPendingDeletion ? 'border-destructive' : 'border-primary'} border-t-transparent animate-spin`}></div>
            <span className={`text-xs font-medium ${isPendingDeletion ? 'text-destructive' : ''}`}>
              {isPendingDeletion ? 'Deleting...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}

      <Card
        className={cn(
          "w-full rounded-lg shadow-sm cursor-pointer min-h-[64px] flex flex-col justify-between border-b",
          "transition-all duration-200 border",
          isSelected
            ? "border-primary/80 bg-primary/5 shadow-sm border-l-4 border-l-primary"
            : "border-border/50 hover:border-border hover:shadow-sm hover:bg-muted/10",
          (isLoading || isPendingDeletion) && "pointer-events-none"
        )}
        onClick={handleCardClick}
      >
        <div className="px-2.5 py-2 flex flex-col h-full justify-between relative">
          {/* Status badge - positioned at top-right for better visibility */}
          <Badge 
            variant={activity.difficultyLevel === 'advanced' ? 'destructive' : 'outline'} 
            className={cn(
              "absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 h-4 font-normal z-10",
              activity.difficultyLevel === 'advanced' ? 'bg-amber-500/90 hover:bg-amber-500' : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
            )}
          >
            {activity.difficultyLevel === 'advanced' ? 'Advanced' : 'Developing'}
          </Badge>

          <div className="flex items-start justify-between gap-2 mt-0.5">
            {/* Left side: Checkbox and Title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="flex-shrink-0 text-muted-foreground rounded-sm hover:bg-muted/60 transition-colors"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click when toggling selection
                  onSelect(activity._id);
                }}
              >
                {isSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary stroke-[2.5px]" />
                ) : (
                  <Square className="h-4 w-4 stroke-[2px]" />
                )}
              </div>
              <div className="flex-1 min-w-0 max-w-[calc(100%-40px)]">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors pr-1">
                        {activity.title}
                      </h4>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start" className="max-w-[250px]">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{activity.title}</span>
                        {activity.description && (
                          <span className="text-xs text-muted-foreground">{activity.description}</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {activity.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5 pr-2">
                    {activity.description}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Metadata - Now only for difficulty */}
            <div className="flex-shrink-0 mr-5">
              {/* Removed difficulty section here since we're showing it as a status badge */}
              {false && displayDifficulties.length > 0 ? (
                <div className="flex items-center gap-1">
                  {displayDifficulties.map((level: string, idx: number) => (
                    <DifficultyBadge key={level + idx} difficultyLevel={level as DifficultyLevel} size="sm" />
                  ))}
                  {remainingDifficulties.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-muted cursor-pointer">+{remainingDifficulties.length}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {remainingDifficulties.map((level: string, idx: number) => (
                          <DropdownMenuItem key={level + idx} className="px-2 py-1 text-[10px]">
                            <DifficultyBadge difficultyLevel={level as DifficultyLevel} size="sm" />
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ) : (
                <span className="hidden text-[10px] text-muted-foreground">No difficulty</span>
              )}
            </div>
          </div>

          {/* Footer section with Tags and Student Count */}
          <div className="flex items-center justify-between gap-1.5 mt-2 pl-6 min-h-[20px]">
            {/* Tags section */}
            <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[calc(100%-45px)]">
              <TagIcon className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
              <div className="flex items-center gap-1 flex-nowrap overflow-hidden">
                {displayTags.length > 0 ? (
                  <>
                    {displayTags.map(tag => (
                      <TagUI 
                        key={tag._id} 
                        label={tag.name} 
                        color={tag.color} 
                        size="sm" 
                        className="py-0.5 px-1.5 text-xs shadow-sm max-w-[80px] truncate flex-shrink-0" 
                      />
                    ))}
                    {remainingTags.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge 
                            variant="secondary" 
                            className="ml-1 text-xs px-1.5 py-0 h-5 rounded-full cursor-pointer hover:bg-secondary/80 flex-shrink-0"
                          >
                            +{remainingTags.length}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {remainingTags.map(tag => (
                            <DropdownMenuItem key={tag._id} className="px-2 py-1 text-xs">
                              <TagUI 
                                label={tag.name} 
                                color={tag.color} 
                                size="sm" 
                                className="py-0.5 px-1.5 text-xs w-full" 
                              />
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/70 italic truncate">No tag</span>
                )}
              </div>
            </div>

            {/* Student count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80 flex-shrink-0 bg-muted/30 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              <UsersIcon className="h-2.5 w-2.5" />
              <span className="font-medium">{assignedCount}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
} 