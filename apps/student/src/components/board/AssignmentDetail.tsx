"use client";

import { AssignmentWithMeta, Column } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  ScrollArea,
  Separator,
  Card,
} from '@intellect-kanban/ui';
import { 
  CalendarIcon,
  Clock,
  BarChart3,
  TagIcon,
  XIcon,
  FileIcon,
  Download,
  BookIcon,
  CircleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { formatMinutesToTime } from '@/utils/format';

interface ColumnHistoryItem {
  columnId: string;
  enteredAt: string;
}

interface AssignmentDetailProps {
  assignment: AssignmentWithMeta;
  onClose: () => void;
}

export function AssignmentDetail({ assignment, onClose }: AssignmentDetailProps) {
  // Format due date if it exists
  const formattedDueDate = assignment.dueDate 
    ? format(new Date(assignment.dueDate), 'MMMM d, yyyy')
    : null;
  
  const relativeDate = assignment.dueDate
    ? formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })
    : null;

  // Determine if the assignment is overdue
  const isOverdue = assignment.dueDate 
    ? new Date(assignment.dueDate) < new Date() 
    : false;
  
  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  // Get status details based on columnId
  const getStatusDetails = () => {
    switch (assignment.columnId) {
      case 'done':
        return {
          label: 'Completed',
          icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
          color: 'text-green-500'
        };
      case 'review':
        return {
          label: 'In Review',
          icon: <InfoIcon className="h-4 w-4 text-blue-500" />,
          color: 'text-blue-500'
        };
      case 'doing':
        return {
          label: 'In Progress',
          icon: <CircleIcon className="h-4 w-4 text-amber-500" />,
          color: 'text-amber-500'
        };
      default:
        return {
          label: isOverdue ? 'Overdue' : 'Not Started',
          icon: isOverdue 
            ? <AlertCircleIcon className="h-4 w-4 text-red-500" /> 
            : <CircleIcon className="h-4 w-4 text-gray-400" />,
          color: isOverdue ? 'text-red-500' : 'text-gray-400'
        };
    }
  };

  const status = getStatusDetails();

  // Column mapping for history
  const getColumnName = (columnId: string): string => {
    const columnNames: Record<string, string> = {
      'backlog': 'Backlog',
      'doing': 'In Progress',
      'review': 'Review',
      'done': 'Done'
    };
    
    return columnNames[columnId] || columnId;
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1 pr-10">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {assignment.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {assignment.priority && (
                  <Badge 
                    variant="outline" 
                    className={`${getPriorityColor(assignment.priority)} border-current`}
                  >
                    {assignment.priority} priority
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`${status.color} border-current flex items-center gap-1`}
                >
                  {status.icon}
                  <span>{status.label}</span>
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Tags */}
          {assignment.tags && assignment.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {assignment.tags.map((tag) => (
                <Badge 
                  key={tag.id} 
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color, 
                    borderColor: `${tag.color}40`
                  }}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}
        </DialogHeader>
        
        <Separator className="my-0" />
        
        <ScrollArea className="p-6 max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Metadata/statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 rounded-md p-4">
              {/* Due date */}
              {formattedDueDate && (
                <div className="flex items-start">
                  <div className="bg-background rounded-md p-2 mr-3">
                    <CalendarIcon className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-red-500' : ''}`}>
                      {formattedDueDate}
                    </p>
                    {relativeDate && (
                      <p className={`text-xs ${isOverdue ? 'text-red-500/80' : 'text-muted-foreground'}`}>
                        {relativeDate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Estimated time */}
              {assignment.estimatedTimeMinutes && (
                <div className="flex items-start">
                  <div className="bg-background rounded-md p-2 mr-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Time</p>
                    <p className="text-sm font-medium">
                      {formatMinutesToTime(assignment.estimatedTimeMinutes)}
                    </p>
                  </div>
                </div>
              )}

              {/* Difficulty */}
              {assignment.difficultyLevel && (
                <div className="flex items-start">
                  <div className="bg-background rounded-md p-2 mr-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="text-sm font-medium capitalize">
                      {assignment.difficultyLevel}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {assignment.description && (
              <Card className="p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <BookIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-primary">Description</h3>
                </div>
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                  {assignment.description}
                </div>
              </Card>
            )}

            {/* Notes */}
            {assignment.notes && (
              <Card className="p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-primary">Notes</h3>
                </div>
                <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                  {assignment.notes}
                </div>
              </Card>
            )}

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <Card className="p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium text-primary">
                    Attachments ({assignment.attachments.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {assignment.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between bg-muted/15 hover:bg-muted/30 rounded-md p-3 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-background rounded-md p-1.5">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        <span className="text-xs">Download</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Current status */}
            <Card className="p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-primary">Current Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="bg-green-500/20 text-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Assignment created</p>
                    <p className="text-muted-foreground">
                      {format(new Date(assignment.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className={`bg-${status.color.split('-')[1]}-500/20 ${status.color} rounded-full w-6 h-6 flex items-center justify-center`}>
                    {status.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      Currently in {getColumnName(assignment.columnId)}
                    </p>
                    <p className="text-muted-foreground">
                      Last updated: {format(new Date(assignment.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 