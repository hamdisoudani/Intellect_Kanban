"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Avatar,
  AvatarFallback,
  Checkbox,
  ScrollArea,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Alert,
} from '@intellect-kanban/ui';
import { Search, UserPlus, X, Users, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/utils/types/classes';

interface ManageStudentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: any;
  classStudents: User[];
  onStudentsUpdated?: () => void;
}

export function ManageStudentsDialog({
  isOpen,
  onOpenChange,
  activity,
  classStudents,
  onStudentsUpdated
}: ManageStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [initialStudents, setInitialStudents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize selected students from activity
  useEffect(() => {
    if (activity && activity.assignedStudents) {
      // Convert to array of IDs if not already
      const studentIds = activity.assignedStudents.map((student: any) => 
        typeof student === 'object' ? getStudentId(student) : student
      );
      setSelectedStudents(studentIds);
      setInitialStudents(studentIds);
      // Clear any previous error message
      setErrorMessage(null);
    } else {
      setSelectedStudents([]);
      setInitialStudents([]);
    }
  }, [activity]);

  // Clear error message when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset error when dialog closes
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Filter students based on search query
  const filteredStudents = classStudents.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if a student was already assigned when the dialog opened
  const isInitiallyAssigned = (studentId: string) => {
    return initialStudents.includes(studentId);
  };

  // Helper to get the student ID consistently
  const getStudentId = (student: any) => {
    return student.id || student._id;
  };

  // Helper to get the activity ID consistently
  const getActivityId = (activity: any) => {
    return activity.id || activity._id;
  };

  // Count only newly selected students (exclude initially assigned ones)
  const newlySelectedCount = selectedStudents.filter(id => !initialStudents.includes(id)).length;

  // Toggle student selection
  const toggleStudent = (studentId: string) => {
    // Don't allow deselecting initially assigned students
    if (isInitiallyAssigned(studentId)) {
      return;
    }
    
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Save changes
  const handleSave = async () => {
    if (!activity) return;
    
    const activityId = getActivityId(activity);
    if (!activityId) return;
    
    // Reset any previous error
    setErrorMessage(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/board/${activity.boardId}/activities/${activityId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract the specific error message from the response
        let errorMsg = data.error || 'Failed to update assigned students';
        
        // Make MongoDB version conflict errors more user-friendly
        if (errorMsg.includes("No matching document found for id") && errorMsg.includes("version")) {
          errorMsg = "The activity was modified by someone else. Please refresh and try again.";
        }
        
        setErrorMessage(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Success - show toast and close dialog
      toast.success('Students assigned successfully', {
        description: 'Refreshing assignments...'
      });
      onStudentsUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning students:', error);
      // Display the specific error message
      const errorMsg = error.message || 'Failed to update assigned students';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Assigned Students
          </DialogTitle>
          <DialogDescription>
            {activity?.title && (
              <span className="font-medium text-foreground">{activity.title}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Students list */}
        <div className="border rounded-md">
          <div className="p-2 bg-muted/30 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Students</span>
            <div className="flex items-center gap-2">
              {newlySelectedCount > 0 && (
                <Badge variant="outline" className="h-5 text-xs bg-primary/10 text-primary border-primary/20">
                  +{newlySelectedCount} new
                </Badge>
              )}
              <Badge variant="outline" className="h-5 text-xs">
                {selectedStudents.length} total
              </Badge>
            </div>
          </div>
          
          {/* Error message */}
          {errorMessage && (
            <div className="p-2 bg-red-50 border-b border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{errorMessage}</span>
              <button 
                onClick={() => setErrorMessage(null)}
                className="text-red-700 hover:text-red-900"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </button>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : classStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No students available in this class</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="p-2 space-y-1">
                {filteredStudents.map(student => {
                  const studentId = getStudentId(student);
                  const isAlreadyAssigned = isInitiallyAssigned(studentId);
                  return (
                    <div 
                      key={studentId}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                        isAlreadyAssigned 
                          ? 'bg-muted/30' 
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div key={`tooltip-trigger-${studentId}`}>
                                <Checkbox 
                                  id={`student-${studentId}`}
                                  checked={selectedStudents.includes(studentId)}
                                  onCheckedChange={() => toggleStudent(studentId)}
                                  disabled={isAlreadyAssigned}
                                  className={isAlreadyAssigned ? 'cursor-not-allowed' : ''}
                                />
                              </div>
                            </TooltipTrigger>
                            {isAlreadyAssigned && (
                              <TooltipContent>
                                <p className="text-xs">Already assigned</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {student.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center">
                          <label 
                            htmlFor={`student-${studentId}`}
                            className={`text-sm ${isAlreadyAssigned ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {student.name}
                          </label>
                          {isAlreadyAssigned && (
                            <Badge variant="outline" className="ml-2 h-4 text-[10px] px-1 bg-primary/10 text-primary border-primary/20">
                              Assigned
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isAlreadyAssigned && (
                        <CheckCircle className="h-4 w-4 text-primary/70" />
                      )}
                    </div>
                  );
                })}
                
                {filteredStudents.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-sm text-muted-foreground">No matching students found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="gap-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Save Assignments</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 