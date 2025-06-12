"use client";

import { Button } from '@intellect-kanban/ui';
import { Filter, User, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@intellect-kanban/ui';
import { Checkbox } from '@intellect-kanban/ui';
import { ScrollArea } from '@intellect-kanban/ui';
import { cn } from '@intellect-kanban/utils';

interface FilterOption {
  _id: string;
  name: string;
}

interface BoardLevelFilterBarProps {
  studentOptions: FilterOption[];
  selectedStudents: Set<string>;
  onStudentFilterChange: (studentId: string) => void;
  onClearFilters: () => void;
  onClearStudentFilters?: () => void;
  className?: string;
  compact?: boolean;
}

export function BoardLevelFilterBar({
  studentOptions,
  selectedStudents,
  onStudentFilterChange,
  onClearFilters,
  onClearStudentFilters,
  className,
  compact = false,
}: BoardLevelFilterBarProps) {
  const activeFilterCount = selectedStudents.size;

  if (studentOptions.length === 0) {
    return null; // Don't render if there's nothing to filter by
  }

  return (
    <div className={cn(
      "flex items-center gap-2",
      compact ? "p-0" : "p-2 border-b bg-muted/30",
      className
    )}>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={activeFilterCount > 0 ? "default" : "outline"} 
            size="sm" 
            className={cn(
              "text-xs gap-1.5",
              compact ? "h-7 sm:h-7 px-1.5 sm:px-2" : "h-7"
            )}
          >
            <Filter className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span className="hidden xs:inline">Students</span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-background text-foreground px-1.5 py-0.5 text-[10px] font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end" side="bottom" sideOffset={5}>
          <div className="p-2 border-b bg-muted/30 flex justify-between items-center">
            <span className="text-sm font-medium">Filter Students</span>
            {selectedStudents.size > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearStudentFilters || onClearFilters} 
                className="h-6 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-[40vh] max-h-60">
            <div className="p-4">
              {studentOptions.map(student => (
                <div key={student._id} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={`student-${student._id}`}
                    checked={selectedStudents.has(student._id)}
                    onCheckedChange={() => onStudentFilterChange(student._id)}
                  />
                  <label htmlFor={`student-${student._id}`} className="text-sm font-medium leading-none">
                    {student.name}
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters} 
          className={cn(
            "text-xs",
            compact ? "h-7 px-2" : "h-7 ml-auto"
          )}
        >
          <X className={cn("h-3.5 w-3.5", compact ? "" : "mr-2")} />
          {!compact && "Clear"}
        </Button>
      )}
    </div>
  );
} 