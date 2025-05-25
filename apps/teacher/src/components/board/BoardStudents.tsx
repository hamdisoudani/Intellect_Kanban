"use client";

import { useState } from 'react';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@intellect-kanban/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

// Define the student interface
export interface Student {
  id?: string; // Make id optional to match reality
  _id?: string; // Add _id as an alternative
  name: string;
  isOnline?: boolean;
}

interface BoardStudentsProps {
  students: Student[];
  maxVisible?: number;
}

// Helper function to get a reliable ID for a student
function getStudentId(student: Student, index: number): string {
  // Try to use id or _id, fallback to index as string
  return student.id || student._id || `student-${index}`;
}

export function BoardStudents({ students, maxVisible = 5 }: BoardStudentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sort students by online status
  const sortedStudents = [...students].sort((a, b) => {
    // Sort by online status first (online users first)
    if ((a.isOnline && b.isOnline) || (!a.isOnline && !b.isOnline)) {
      // If both have the same online status, sort alphabetically
      return a.name.localeCompare(b.name);
    }
    return a.isOnline ? -1 : 1;
  });
  
  // Determine which students to show directly in the component
  const visibleStudents = sortedStudents.slice(0, maxVisible);
  
  // Count of remaining students (not shown directly)
  const remainingCount = Math.max(0, students.length - maxVisible);

  if (!students?.length) {
    return null;
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        <TooltipProvider delayDuration={150}>
          {visibleStudents.map((student, index) => (
            <Tooltip key={getStudentId(student, index)}>
              <TooltipTrigger asChild>
                <div className="relative hover:z-10">
                  <Avatar className="h-8 w-8 border-2 border-background hover:translate-y-[-2px] transition-transform cursor-pointer">
                    <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${getStudentId(student, index)}`} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {student.isOnline !== undefined && (
                    <div 
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                        student.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="px-2.5 py-1">
                {student.name}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        
        {remainingCount > 0 && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="h-8 w-8 rounded-full text-xs font-medium border-2 border-background hover:bg-muted cursor-pointer"
              >
                +{remainingCount}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 overflow-hidden" align="end" sideOffset={5}>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between p-3 border-b">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <h4 className="text-sm font-medium">All Students</h4>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {students.length} total
                      </Badge>
                    </div>
                    <motion.div 
                      className="space-y-0.5 max-h-72 overflow-y-auto p-1.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                      {sortedStudents.map((student, index) => (
                        <motion.div 
                          key={getStudentId(student, index)}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * (index % 10), duration: 0.2 }}
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={`https://api.dicebear.com/7.x/lorelei/svg?seed=${getStudentId(student, index)}`} alt={student.name} />
                            <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate font-medium">{student.name}</span>
                          {student.isOnline !== undefined && (
                            <Badge 
                              variant={student.isOnline ? "default" : "outline"}
                              className={`text-xs px-2 py-0 h-5 ${student.isOnline ? 'bg-green-500 hover:bg-green-500' : ''}`}
                            >
                              {student.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
} 