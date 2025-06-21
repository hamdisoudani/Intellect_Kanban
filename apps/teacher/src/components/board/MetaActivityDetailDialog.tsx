"use client";

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Badge,
  Input,
  Textarea,
  Label,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@intellect-kanban/ui';
import { PencilIcon, CalendarIcon, ClockIcon, X, Save } from 'lucide-react';
import { DifficultyBadge } from './DifficultyBadge';
import { TagBadge } from '../ui/TagBadge';
import { Tag } from '../ui/Tag';
import { format, formatDistanceToNow } from 'date-fns';
import { useActivitiesStore } from '@/store/activitiesStore';
import { useBoardStore } from '@/store/boardStore';
import { DifficultyLevel, difficultyLevelLabels } from '@/types/activities';
import { Tag as TagType } from '@/types/tags';
import { toast } from 'sonner';
import { TagsSelectorWithBadges } from '../ui/TagsSelectorWithBadges';
import { useTags } from '@/contexts/TagsContext';

// Generic Activity interface that works with both Activity types in the codebase
interface GenericActivity {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  dueDate?: string;
  createdBy: any;
  type: 'personal' | 'meta';
  assignedStudents?: any[];
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  tags?: any[];
  createdAt?: string;
  updatedAt?: string;
  priority?: string;
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
  classStudents: any[];
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
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    dueDate: '', 
    difficultyLevel: '',
    tags: [] as TagType[]
  });
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const updateActivity = useActivitiesStore(state => state.updateActivity);
  const board = useBoardStore(state => state.board);
  const boardId = board?._id || '';
  
  // Get tags from context
  const { tags: availableTags, createTag } = useTags();

  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen && activity) {
      setFormData({
        title: activity.title,
        description: activity.description || '',
        dueDate: activity.dueDate ? activity.dueDate.split('T')[0] : '',
        difficultyLevel: activity.difficultyLevel || '',
        tags: activity.tags || []
      });
      setShowDeleteAlert(false);
      setIsEditing(false);
    }
  }, [isOpen, activity]);

  if (!activity) return null;

  // Format dates for display
  const formattedDueDate = activity.dueDate
    ? format(new Date(activity.dueDate), 'MMM d, yyyy')
    : 'No due date';
  const createdTimeAgo = activity.createdAt
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : '';

  // Handle saving changes
  const handleSaveChanges = async () => {
    if (!activity || !boardId) return;
    setIsSaving(true);
    const updates: any = {};
    if (formData.title !== activity.title) updates.title = formData.title;
    if (formData.description !== (activity.description || '')) updates.description = formData.description;
    if (formData.dueDate && formData.dueDate !== activity.dueDate?.split('T')[0]) updates.dueDate = formData.dueDate;
    if (formData.difficultyLevel !== activity.difficultyLevel) updates.difficultyLevel = formData.difficultyLevel;
    
    // Handle tags update
    const currentTagIds = (activity.tags || []).map(tag => typeof tag === 'object' ? tag._id : tag);
    const newTagIds = formData.tags.map(tag => tag._id);
    
    // Check if tags have changed by comparing arrays
    const tagsChanged = 
      currentTagIds.length !== newTagIds.length || 
      currentTagIds.some(id => !newTagIds.includes(id)) ||
      newTagIds.some(id => !currentTagIds.includes(id));
    
    if (tagsChanged) {
      updates.tags = formData.tags;
    }
    
    if (Object.keys(updates).length) {
      try {
        await updateActivity(boardId, activity._id, updates);
        toast.success('Activity updated successfully');
        // Close dialog after successful update
        if (onClose) onClose();
        if (onOpenChange) onOpenChange(false);
      } catch (error) {
        toast.error('Failed to update activity');
        console.error(error);
      }
    } else {
      // No changes to save
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  // Handle delete confirmation
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

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open && !isEditing) {
            if (onClose) onClose();
            if (onOpenChange) onOpenChange(false);
            setShowDeleteAlert(false);
          }
        }}
      >
        <DialogContent className="max-w-md [&>button.absolute.top-4.right-4]:hidden">
          {isEditing ? (
            // Edit Mode
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Edit Activity</DialogTitle>
                </div>
                <div className="mt-3">
                  <Label htmlFor="activityTitle" className="text-sm font-medium mb-1.5 block">Title</Label>
                  <Input
                    id="activityTitle"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="font-medium"
                    placeholder="Activity Title"
                  />
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/40">
                      Class Activity
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                    <Select
                      value={formData.difficultyLevel}
                      onValueChange={value => setFormData({ ...formData, difficultyLevel: value })}
                    >
                      <SelectTrigger id="difficultyLevel">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DifficultyLevel).map(level => (
                          <SelectItem key={level} value={level}>
                            {difficultyLevelLabels[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Add a description..."
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <TagsSelectorWithBadges
                    availableTags={availableTags}
                    selectedTags={formData.tags}
                    onChange={(tags) => setFormData({...formData, tags})}
                    onCreateTag={createTag}
                    maxTags={5}
                  />
                </div>
              </div>
              
              <DialogFooter className="border-t pt-4 mt-4">
                <div className="flex justify-end gap-2 w-full">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="border-gray-200"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <>
                        <span className="animate-spin mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            // View Mode
            <>
              <DialogHeader className="pb-3 mb-1 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-semibold">{activity.title}</DialogTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="gap-1 hover:bg-primary/10"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="flex flex-wrap gap-2 mb-6 mt-2">
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
              
              <div className="space-y-8">
                {/* Details Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted/30 p-1.5 rounded-md">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Due Date</span>
                        <p className="text-sm">{formattedDueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted/30 p-1.5 rounded-md">
                        <ClockIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-sm font-medium">Created</span>
                        <p className="text-sm">{createdTimeAgo}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Description Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Description</h3>
                  {activity.description ? (
                    <div className="text-sm whitespace-pre-wrap p-4 bg-muted/20 rounded-md border border-muted/30">
                      {activity.description}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/10 rounded-md border border-dashed border-muted flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No description provided</p>
                    </div>
                  )}
                </div>
                
                {/* Tags Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Tags</h3>
                  {activity.tags && activity.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map(tag => (
                        <TagBadge
                          key={tag._id}
                          label={tag.name}
                          color={tag.color}
                          size="md"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/10 rounded-md border border-dashed border-muted flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No tags assigned</p>
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter className="border-t pt-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (onClose) onClose();
                    if (onOpenChange) onOpenChange(false);
                  }}
                  className="w-full sm:w-auto gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
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