"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Card,
  CardContent,
  Skeleton
} from '@intellect-kanban/ui';
import { 
  CalendarIcon, 
  MessageCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  AlignLeftIcon,
  InfoIcon,
  LayoutIcon,
  UserPlus,
  TimerIcon,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Tag as TagType } from '@/types/tags';
import { User } from '@/utils/types/classes';
import { DifficultyBadge } from './DifficultyBadge';
import { Tag } from '../ui/Tag';
import stc from 'string-to-color';
import { DifficultyLevel } from '@/types/activities';

// Generic Activity interface that works with both Activity types in the codebase
interface GenericActivity {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  dueDate?: string;
  createdBy?: any;
  type: 'personal' | 'meta';
  assignedStudents?: any[];
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  tags?: any[];
  createdAt: string;
  updatedAt: string;
  priority?: any;
  columnId?: string;
}

interface MetaActivityDetailDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  activity: GenericActivity | null;
  onActivityDeleted?: (activityId: string) => void;
  onDeletePending?: (activityId: string) => void;
  onManageStudents?: (activity: GenericActivity) => void;
  classStudents: User[];
}

export function MetaActivityDetailDialog({
  isOpen,
  onClose,
  onOpenChange,
  activity,
  onActivityDeleted,
  onDeletePending,
  onManageStudents,
  classStudents = []
}: MetaActivityDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedTags, setResolvedTags] = useState<TagType[]>([]);
  
  // Reset tab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setShowDeleteAlert(false);
    }
  }, [isOpen]);

  // Extract and set tags
  useEffect(() => {
    if (!activity?.tags || !Array.isArray(activity.tags)) {
      setResolvedTags([]);
      return;
    }
    
    // Check if we have full tag objects or just IDs
    const hasFullTagObjects = activity.tags.some((tag: any) => 
      typeof tag === 'object' && tag !== null && tag.name && tag.color
    );
    
    if (hasFullTagObjects) {
      // We have full tag objects, use them directly
      setResolvedTags(activity.tags as unknown as TagType[]);
    } else {
      // For IDs, use empty objects with generated colors
      const tagObjects: TagType[] = activity.tags.map((tag: any) => {
        const tagId = typeof tag === 'object' && tag !== null ? tag._id : String(tag);
        return { 
          _id: tagId, 
          name: 'Tag ' + tagId.substring(0, 5), 
          color: stc(tagId),
          createdBy: '',
          createdAt: '',
          updatedAt: '' 
        };
      });
      setResolvedTags(tagObjects);
    }
  }, [activity?.tags]);
  
  // Get assigned students details
  const assignedStudents = useMemo(() => {
    if (!activity || !activity.assignedStudents || !Array.isArray(activity.assignedStudents)) {
      return [];
    }

    return activity.assignedStudents.map(student => {
      if (typeof student === 'object' && student !== null) {
        return student;
      }
      
      // Try to find the student in classStudents
      const studentId = String(student);
      const foundStudent = classStudents.find(s => String(s._id) === studentId);
      
      if (foundStudent) {
        return {
          _id: studentId,
          name: foundStudent.name || 'Unknown Student'
        };
      }
      
      return {
        _id: studentId,
        name: 'Student ' + studentId.substring(0, 5)
      };
    });
  }, [activity?.assignedStudents, classStudents]);
  
  if (!activity) return null;

  // Format dates for display
  const formattedDueDate = activity.dueDate 
    ? format(new Date(activity.dueDate), 'MMM d, yyyy')
    : 'No due date';
  
  const createdDate = activity.createdAt
    ? format(new Date(activity.createdAt), 'MMM d, yyyy')
    : 'Unknown';
    
  const createdTimeAgo = activity.createdAt
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : '';
  
  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

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
  
  const handleManageStudents = () => {
    if (onManageStudents) {
      onManageStudents(activity);
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Activity Details</h3>
              {activity.dueDate && (
                <div className="flex gap-2 items-center">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Due: {formattedDueDate}</span>
                </div>
              )}
              {activity.estimatedTimeMinutes && (
                <div className="flex gap-2 items-center">
                  <TimerIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Estimated time: 
                    {activity.estimatedTimeMinutes < 60
                      ? ` ${activity.estimatedTimeMinutes} minutes`
                      : ` ${Math.floor(activity.estimatedTimeMinutes / 60)}h ${activity.estimatedTimeMinutes % 60}m`}
                  </span>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Created {createdTimeAgo}</span>
              </div>
            </div>
          </div>
        );
      case 'description':
        return activity.description ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Description</h3>
            <div className="text-sm whitespace-pre-wrap p-3 bg-muted/20 rounded-md">
              {activity.description}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <AlignLeftIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
            <p>No description provided</p>
          </div>
        );
      case 'students':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Students ({assignedStudents.length})</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleManageStudents}
                className="h-8"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Manage
              </Button>
            </div>
            
            {assignedStudents.length > 0 ? (
              <div className="space-y-2">
                {assignedStudents.map(student => (
                  <div key={student._id} className="flex items-center gap-3 p-2 rounded-md bg-muted/20">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-400/80 to-indigo-600/80 text-white">
                        {student.name?.substring(0, 2).toUpperCase() || 'ST'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <UsersIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p>No students assigned</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs mt-3" 
                  onClick={handleManageStudents}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Assign Students
                </Button>
              </div>
            )}
          </div>
        );
      case 'tags':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Tags</h3>
            {resolvedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resolvedTags.map((tag) => (
                  <Tag
                    key={tag._id}
                    label={tag.name}
                    color={tag.color}
                    size="md"
                    className="py-1 px-3"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
                <LayoutIcon className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p>No tags assigned</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

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
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-semibold mb-1">{activity.title}</DialogTitle>
          <DialogHeader className="mt-0 p-0">
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40">
                Class Activity
              </Badge>
              {activity.difficultyLevel && (
                <DifficultyBadge 
                  difficultyLevel={activity.difficultyLevel as DifficultyLevel} 
                  size="sm"
                />
              )}
            </div>
          </DialogHeader>
          
          {/* Tabs navigation */}
          <div className="border-b mt-2">
            <div className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'details' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <InfoIcon className="h-4 w-4 inline-block mr-1.5" />
                Details
              </button>
              
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'description' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <AlignLeftIcon className="h-4 w-4 inline-block mr-1.5" />
                Description
              </button>
              
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'students' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <UsersIcon className="h-4 w-4 inline-block mr-1.5" />
                Students ({assignedStudents.length})
              </button>
              
              <button
                onClick={() => setActiveTab('tags')}
                className={`px-4 py-2 border-b-2 text-sm font-medium ${
                  activeTab === 'tags' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutIcon className="h-4 w-4 inline-block mr-1.5" />
                Tags ({resolvedTags.length})
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          <div className="py-3 min-h-[120px]">
            {renderTabContent()}
          </div>
          
          <DialogFooter className="border-t pt-3">
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
              and remove all student assignments related to it.
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