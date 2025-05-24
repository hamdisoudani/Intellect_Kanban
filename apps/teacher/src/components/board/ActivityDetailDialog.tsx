"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Badge,
  Avatar,
  AvatarFallback,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@intellect-kanban/ui';
import { Activity } from '@/utils/types';
import { ColumnTransition } from '@/utils/types/activity';
import { 
  CalendarIcon, 
  MessageCircleIcon, 
  ClockIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  AlignLeftIcon,
  UserIcon,
  InfoIcon,
  SquareAsteriskIcon,
  LayoutIcon,
  CheckCircle2,
  XCircle,
  MoveRight,
  HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { PriorityBadge } from './PriorityBadge';
import { StudentOption } from '@/utils/types';

interface ActivityDetailDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  activity: Activity | null;
  columns?: Array<{ id: string; name: string; }>;
  students?: StudentOption[];
  onActivityDeleted?: (activityId: string) => void;
  onDeletePending?: (activityId: string) => void;
}

interface ExtendedStudentOption extends StudentOption {
  _id: string;
}

// Interface for enhanced column transition with display data
interface EnhancedColumnTransition extends ColumnTransition {
  columnName: string;
  enteredAtFormatted: string;
  enteredAtTimeAgo: string;
}

export function ActivityDetailDialog({
  isOpen,
  onClose,
  onOpenChange,
  activity,
  columns = [],
  students = [],
  onActivityDeleted,
  onDeletePending
}: ActivityDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');
  const [showEditMode, setShowEditMode] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // Reset tab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setShowEditMode(false);
      setShowDeleteAlert(false);
    }
  }, [isOpen]);
  
  if (!activity) return null;

  // Memoized values to prevent recalculations on re-renders
  const isMetaActivity = activity.type === 'meta';
  
  // Find the column name for this activity
  const columnName = useMemo(() => 
    columns.find(col => col.id === activity.columnId)?.name || 'Unknown Column',
    [activity.columnId, columns]
  );

  // Format due date if it exists
  const formattedDueDate = useMemo(() => 
    activity.dueDate 
      ? format(new Date(activity.dueDate), 'MMM d, yyyy')
      : 'No due date',
    [activity.dueDate]
  );

  // Get assigned students' details
  const assignedStudents = useMemo(() =>
    activity.assignedStudents && activity.assignedStudents.length
      ? students.filter(s => activity.assignedStudents?.includes((s as ExtendedStudentOption)._id))
      : [],
    [activity.assignedStudents, students]
  );

  // Format created date
  const createdDate = useMemo(() =>
    activity.createdAt
      ? format(new Date(activity.createdAt), 'MMM d, yyyy')
      : 'Unknown',
    [activity.createdAt]
  );

  // Get relative time from created date
  const createdTimeAgo = useMemo(() =>
    activity.createdAt
      ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
      : '',
    [activity.createdAt]
  );

  // Get column history with column names for display
  const columnHistory = useMemo(() => {
    // Type assertion to help TypeScript recognize the columnHistory property
    const activityWithHistory = activity as Activity & { columnHistory?: ColumnTransition[] };
    
    if (!activityWithHistory.columnHistory || !activityWithHistory.columnHistory.length) {
      return [];
    }
    
    return activityWithHistory.columnHistory.map((transition: ColumnTransition, index: number) => ({
      ...transition,
      columnName: columns.find(col => col.id === transition.columnId)?.name || 'Unknown Column',
      enteredAtFormatted: format(new Date(transition.enteredAt), 'MMM d, yyyy'),
      enteredAtTimeAgo: formatDistanceToNow(new Date(transition.enteredAt), { addSuffix: true })
    }));
  }, [activity, columns]);
  
  // Callbacks for actions
  const handleAddComment = useCallback(() => {
    if (!comment.trim()) return;
    
    // In a real app, this would call an API to save the comment
    toast.success('Comment functionality coming soon');
    setComment('');
  }, [comment]);

  const handleDelete = useCallback(() => {
    setShowDeleteAlert(true);
  }, []);

  const handleConfirmDelete = async () => {
    try {
      // Close both dialogs immediately
      setShowDeleteAlert(false);
      if (onOpenChange) onOpenChange(false);
      
      // Notify parent that this activity is pending deletion
      if (onDeletePending) {
        onDeletePending(activity._id);
      }
      
      // Call the API to delete the activity
      const response = await fetch(`/api/activities/${activity._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete activity');
      }
      
      // Show success message
      toast.success('Activity deleted successfully');
      
      // Call the callback to refresh the activities
      if (onActivityDeleted) {
        onActivityDeleted(activity._id);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      
      // Notify parent to remove pending state since deletion failed
      if (onDeletePending) {
        onDeletePending('');
      }
    }
  };
  
  const handleEdit = useCallback(() => {
    // Toggle edit mode
    setShowEditMode(true);
  }, []);
  
  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            if (onClose) onClose();
            if (onOpenChange) onOpenChange(false);
            setShowDeleteAlert(false);
          }
        }}
      >
        <DialogContent className={`max-w-md ${isMetaActivity ? 'border-indigo-200 dark:border-indigo-800' : ''}`}>
          <DialogHeader className="space-y-1">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <DialogTitle className="flex items-center gap-2 mb-1">
                  {activity.title}
                </DialogTitle>
                <div className="flex flex-wrap gap-2 mt-1">
                  {isMetaActivity ? (
                    <Badge variant="outline" className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                      <UsersIcon className="h-3 w-3 mr-1" /> Class Activity
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      <UserIcon className="h-3 w-3 mr-1" /> Personal
                    </Badge>
                  )}
                  <PriorityBadge priority={activity.priority || 'Medium'} />
                  {activity.columnId && !isMetaActivity && (
                    <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800/30">
                      <LayoutIcon className="h-3 w-3 mr-1" /> {columnName}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleEdit}
                >
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                  onClick={handleDelete}
                >
                  <TrashIcon className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="details" className="text-xs">
                <InfoIcon className="h-3.5 w-3.5 mr-1.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="description" className="text-xs">
                <AlignLeftIcon className="h-3.5 w-3.5 mr-1.5" />
                Description
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs">
                <MessageCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                Comments
              </TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <TabsContent 
                  key="details-tab"
                  value="details" 
                  className="space-y-4 min-h-[180px] pt-4"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Due Date */}
                    <div className="flex gap-2 items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Due Date</h4>
                        <p className="text-sm">{formattedDueDate}</p>
                      </div>
                    </div>

                    {/* Created */}
                    <div className="flex gap-2 items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <ClockIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-muted-foreground">Created</h4>
                        <p className="text-sm">{createdDate}</p>
                        <p className="text-xs text-muted-foreground">{createdTimeAgo}</p>
                      </div>
                    </div>
                    
                    {/* Creator */}
                    {activity.createdBy && (
                      <div className="flex gap-2 items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <UserIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Created by</h4>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                                {activity.createdBy.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{activity.createdBy.name || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Assigned Students for Meta Activities */}
                    {isMetaActivity && (
                      <div className="flex gap-2 items-start p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mt-0.5">
                          <UsersIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Assigned to</h4>
                          {assignedStudents.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {assignedStudents.map(student => (
                                <div 
                                  key={(student as ExtendedStudentOption)._id} 
                                  className="flex items-center gap-1.5 bg-muted py-1 px-2 rounded-full text-xs"
                                >
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px]">
                                      {student.name?.charAt(0) || 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{student.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No students assigned</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Column History - only for personal activities */}
                    {!isMetaActivity && columnHistory.length > 0 && (
                      <div className="flex gap-2 items-start p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mt-0.5">
                          <HistoryIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-muted-foreground">Column History</h4>
                          
                          <ScrollArea className="h-[100px] mt-1 rounded-md border">
                            <div className="p-2">
                              {columnHistory.map((transition: EnhancedColumnTransition, index: number) => (
                                <div 
                                  key={index} 
                                  className="flex items-center gap-2 py-1.5 border-b last:border-0 text-xs"
                                >
                                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"></div>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="font-medium text-xs cursor-help">
                                          {transition.columnName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">{transition.enteredAtFormatted}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <span className="text-muted-foreground text-xs ml-auto">
                                    {transition.enteredAtTimeAgo}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              )}
            
              {activeTab === 'description' && (
                <TabsContent 
                  key="description-tab"
                  value="description" 
                  className="min-h-[180px] pt-4"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full"
                  >
                    {activity.description ? (
                      <div className="bg-muted/30 p-3 rounded-md border border-muted">
                        <p className="text-sm whitespace-pre-wrap">{activity.description}</p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                        <AlignLeftIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
                        <p>No description provided</p>
                      </div>
                    )}
                  </motion.div>
                </TabsContent>
              )}
            
              {activeTab === 'comments' && (
                <TabsContent 
                  key="comments-tab"
                  value="comments" 
                  className="min-h-[180px] pt-4"
                  asChild
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full"
                  >
                    <div className="mb-3">
                      <Textarea 
                        placeholder="Add a comment..." 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none text-sm"
                        rows={2}
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!comment.trim()}
                          className="h-8 px-3"
                        >
                          <MessageCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                          Comment
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center justify-center h-full text-sm text-muted-foreground">
                      <MessageCircleIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
                      <p>No comments yet</p>
                    </div>
                  </motion.div>
                </TabsContent>
              )}
            </AnimatePresence>
          </Tabs>
          
          <AnimatePresence>
            {showEditMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-3 mt-3 overflow-hidden"
              >
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md text-sm flex items-start">
                  <div className="text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5">
                    <InfoIcon className="h-4 w-4" />
                  </div>
                  <p className="text-yellow-800 dark:text-yellow-300">
                    Edit mode is coming soon. This would allow you to update the activity details directly.
                  </p>
                </div>
                
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowEditMode(false)}
                    className="h-8"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      toast.success('Changes saved (mock)');
                      setShowEditMode(false);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (onClose) onClose();
                if (onOpenChange) onOpenChange(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the activity
              and remove it from all boards and student assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 