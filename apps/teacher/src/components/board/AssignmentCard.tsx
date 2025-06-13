"use client";

import { Assignment, ActivityRef } from '@/utils/types/assignment';
import { 
  Card, 
  CardContent, 
  Badge, 
  Avatar, 
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@intellect-kanban/ui';
import { MessageSquare, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { User } from '@/utils/types/classes';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import stc from 'string-to-color';
import Color from 'color';
import { cn } from '@intellect-kanban/utils';

interface AssignmentCardProps {
  assignment: Assignment;
  activityColor?: string;
  onClick?: (assignment: Assignment) => void;
  activityId?: string; // Added to support direct color generation
  showActivityTitle?: boolean; // Optional flag to show/hide activity title
}

export function AssignmentCard({ 
  assignment, 
  activityColor,
  onClick,
  activityId,
  showActivityTitle = false
}: AssignmentCardProps) {
  // Extract data from assignment
  const student = assignment.studentId as User;
  const activity = assignment.activityId as ActivityRef;
  
  // Get student name
  const studentName = typeof assignment.studentId === 'object' 
    ? student.name 
    : 'Student';
    
  // Get student ID for color generation
  const studentId = typeof assignment.studentId === 'object' 
    ? student._id || (student as any).id 
    : typeof assignment.studentId === 'string' 
      ? assignment.studentId 
      : 'unknown';
    
  // Get activity title
  const activityTitle = typeof assignment.activityId === 'object'
    ? activity.title
    : undefined;
    
  // Get feedback count
  const feedbackCount = assignment.feedback?.length || 0;
  
  // Check if there's unread feedback
  const hasUnreadFeedback = assignment.feedback?.some((f: any) => !f.read);

  // Format date (for future use)
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  // Last updated
  const updatedAt = formatDate(assignment.updatedAt);
  const timeAgo = assignment.updatedAt 
    ? formatDistanceToNow(new Date(assignment.updatedAt), { addSuffix: true })
    : '';
  
  // Get status info based on column
  const getStatusInfo = () => {
    switch (assignment.columnId) {
      case 'backlog':
        return { 
          icon: <Clock className="h-3 w-3" />,
          color: 'text-muted-foreground',
          label: 'Backlog',
          bgColor: 'bg-muted/40 dark:bg-muted/20'
        };
      case 'doing':
        return { 
          icon: <AlertCircle className="h-3 w-3" />,
          color: 'text-amber-500',
          label: 'In Progress',
          bgColor: 'bg-amber-100/50 dark:bg-amber-900/20'
        };
      case 'review':
        return { 
          icon: <MessageSquare className="h-3 w-3" />,
          color: 'text-blue-500',
          label: 'Review',
          bgColor: 'bg-blue-100/50 dark:bg-blue-900/20'
        };
      case 'done':
        return { 
          icon: <CheckCircle2 className="h-3 w-3" />,
          color: 'text-green-500',
          label: 'Done',
          bgColor: 'bg-green-100/50 dark:bg-green-900/20'
        };
      default:
        return { 
          icon: <Clock className="h-3 w-3" />,
          color: 'text-muted-foreground',
          label: 'Unknown',
          bgColor: 'bg-muted/40'
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Generate color from student ID for consistent student-specific colors
  const getBorderColor = () => {
    // Always prioritize student ID for color generation for consistent student colors
    if (studentId) return stc(studentId);

    // Fallbacks only if student ID is not available
    if (activityColor) return activityColor;
    if (activityId) return stc(activityId);
    if (typeof assignment.activityId === 'object' && assignment.activityId?._id) {
      return stc(assignment.activityId._id);
    }
    if (typeof assignment.activityId === 'string') {
      return stc(assignment.activityId);
    }

    // Default color as last resort
    return '#7f1de4';
  };
  
  // Helper to get student initials
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ 
        scale: 1.01, 
        y: -1,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }}
      whileTap={{ scale: 0.98 }}
      className="mb-2.5" 
    >
      <Card 
        className="cursor-pointer overflow-hidden w-full transition-all border-l-4"
        style={{ borderLeftColor: getBorderColor() }}
        onClick={() => onClick?.(assignment)}
      >
        {/* Status indicator bar at top */}
        <div className={cn("h-1 w-full", statusInfo.bgColor)} />
        
        <CardContent className="p-2.5">
          {/* Activity Title with color - only show if explicitly requested */}
          {showActivityTitle && activityTitle && (
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/30">
              <h4 className="text-xs font-medium line-clamp-1 flex-1 flex items-center gap-1.5">
                <span 
                  className="inline-block h-2 w-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: getBorderColor() }}
                ></span>
                {activityTitle}
              </h4>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Student Avatar */}
              <Avatar className="h-6 w-6 border-2 border-background">
                <AvatarFallback 
                  className="text-[10px] font-semibold"
                  style={{ 
                    background: `linear-gradient(135deg, ${Color(getBorderColor()).fade(0.3)}, ${Color(getBorderColor()).darken(0.2).fade(0.1)})`,
                    color: Color(getBorderColor()).isDark() ? 'white' : 'black'
                  }}
                >
                  {getInitials(studentName)}
                </AvatarFallback>
              </Avatar>
              
              {/* Student name */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-medium text-sm line-clamp-1 max-w-[120px]">
                {studentName}
              </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {studentName}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Status indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn("h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0", statusInfo.bgColor)}>
                      {statusInfo.icon}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Status: {statusInfo.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            
            {/* Feedback indicator */}
            {feedbackCount > 0 && (
                <Badge 
                  variant={hasUnreadFeedback ? "default" : "outline"}
                  className={cn(
                    "h-5 px-1.5 flex items-center gap-1 text-[10px]",
                    hasUnreadFeedback ? "bg-amber-500 text-white" : ""
                  )}
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>{feedbackCount}</span>
              </Badge>
            )}
            </div>
          </div>
          
          {/* Notes if any */}
          {assignment.notes && (
            <div className="mt-2 p-2 bg-muted/30 rounded-md">
              <p className="text-xs line-clamp-2 text-muted-foreground">
                {assignment.notes}
              </p>
            </div>
          )}
          
          {/* Footer with last updated */}
          {updatedAt && (
            <div className="flex items-center justify-between mt-2 pt-1.5 text-[10px] text-muted-foreground border-t border-border/30">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{updatedAt}</span>
              </div>
              <span className="italic truncate ml-2">{timeAgo}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 