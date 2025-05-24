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

interface AssignmentCardProps {
  assignment: Assignment;
  activityColor?: string;
  onClick?: (assignment: Assignment) => void;
  activityId?: string; // Added to support direct color generation
}

export function AssignmentCard({ 
  assignment, 
  activityColor,
  onClick,
  activityId
}: AssignmentCardProps) {
  // Extract data from assignment
  const student = assignment.studentId as User;
  const activity = assignment.activityId as ActivityRef;
  
  // Get student name
  const studentName = typeof assignment.studentId === 'object' 
    ? student.name 
    : 'Student';
    
  // Get activity title
  const activityTitle = typeof assignment.activityId === 'object'
    ? activity.title
    : undefined;
    
  // Get feedback count
  const feedbackCount = assignment.feedback?.length || 0;

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
  
  // Get status icon based on column
  const getStatusIcon = () => {
    switch (assignment.columnId) {
      case 'backlog':
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'doing':
        return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'review':
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case 'done':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  // Generate color from activity ID if provided
  const getBorderColor = () => {
    // If explicit activityColor is provided, use it
    if (activityColor) return activityColor;
    
    // If activityId is provided directly, use it
    if (activityId) return stc(activityId);
    
    // If activity is an object with _id, use that
    if (typeof assignment.activityId === 'object' && assignment.activityId?._id) {
      return stc(assignment.activityId._id);
    }
    
    // If activity is a string ID, use that
    if (typeof assignment.activityId === 'string') {
      return stc(assignment.activityId);
    }
    
    // Default color
    return '#7f1de4'; // Default string-to-color value
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="mb-3" // Added spacing between cards
    >
      <Card 
        className="hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-primary/5 transition-all cursor-pointer"
        style={{ borderLeftWidth: '4px', borderLeftColor: getBorderColor() }}
        onClick={() => onClick?.(assignment)}
      >
        <CardContent className="p-3">
          {/* Activity Title with color */}
          {activityTitle && (
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium line-clamp-1 flex-1 flex items-center gap-1.5">
                <span 
                  className="inline-block h-2 w-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: getBorderColor() }}
                ></span>
                {activityTitle}
              </h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Status: {assignment.columnId}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Student Avatar */}
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/40 text-primary-foreground">
                  {studentName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Student name */}
              <div className="font-medium text-sm line-clamp-1">
                {studentName}
              </div>
            </div>
            
            {/* Feedback indicator */}
            {feedbackCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs font-medium">{feedbackCount}</span>
              </Badge>
            )}
          </div>
          
          {/* Notes if any */}
          {assignment.notes && (
            <div className="mt-2 mb-1 p-1.5 bg-muted/40 rounded-sm border border-border/50">
              <p className="text-xs line-clamp-2 text-muted-foreground">
                {assignment.notes}
              </p>
            </div>
          )}
          
          {/* Footer with last updated */}
          {updatedAt && (
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{updatedAt}</span>
              </div>
              <span className="italic">{timeAgo}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
} 