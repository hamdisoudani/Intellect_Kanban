"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Avatar,
  AvatarFallback,
  Checkbox,
  ScrollArea,
  Badge,
  Input,
} from '@intellect-kanban/ui';
import { Search, Users, UserPlus, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/utils/types/classes';
import { cn } from '@intellect-kanban/utils';

interface ManageStudentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: any;
  classStudents: User[];
  onStudentsUpdated?: () => void;
}

interface StudentRowProps {
    student: User;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

const StudentRow = ({ student, isSelected, onToggle }: StudentRowProps) => (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer",
        "hover:bg-muted/50",
        isSelected && "bg-primary/10"
      )}
      onClick={() => onToggle(student._id)}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(student._id)}
        aria-label={`Select ${student.name}`}
      />
      <Avatar className="h-8 w-8">
        <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{student.name}</span>
    </div>
  );

export function ManageStudentsDialog({
  isOpen,
  onOpenChange,
  activity,
  classStudents,
  onStudentsUpdated
}: ManageStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { initialStudentIds, unassignedStudents } = useMemo(() => {
    const initialIds = new Set(
      activity?.assignedStudents?.map((student: any) => student?._id || student) || []
    );
    const unassigned = classStudents.filter(s => !initialIds.has(s._id));
    return { initialStudentIds: initialIds, unassignedStudents: unassigned };
  }, [activity, classStudents]);

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds(new Set());
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return unassignedStudents;
    return unassignedStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  }, [searchQuery, unassignedStudents]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!activity?._id || selectedStudentIds.size === 0) return;
    
    setIsSubmitting(true);
    const allStudentIds = [...initialStudentIds, ...selectedStudentIds];
    
    try {
      const response = await fetch(`/api/board/${activity.boardId}/activities/${activity._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: allStudentIds }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update assigned students');
      }
      
      toast.success(`${selectedStudentIds.size} student(s) assigned successfully.`);
      onStudentsUpdated?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning students:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Manage Student Assignments
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            For activity: <span className="font-medium text-foreground">{activity?.title}</span>
          </p>
        </DialogHeader>
        
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search unassigned students..."
            className="w-full pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex-1 flex flex-col mt-4 border rounded-md overflow-hidden">
          <div className="p-3 bg-muted/30 border-b">
            <h3 className="text-base font-semibold">
              Unassigned Students
              <Badge variant="outline" className="ml-2">
                {unassignedStudents.length}
              </Badge>
            </h3>
          </div>
          
          <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <StudentRow
                    key={student._id}
                    student={student}
                    isSelected={selectedStudentIds.has(student._id)}
                    onToggle={handleToggleStudent}
                  />
                ))
              ) : (
                <div className="text-center py-10 px-4">
                  <p className="text-muted-foreground">No unassigned students found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          </div>
        </div>
          
        {initialStudentIds.size > 0 && (
          <div className="mt-4 border rounded-md">
            <div className="p-3 bg-muted/30 border-b">
                <h3 className="text-base font-semibold">
                  Already Assigned
                  <Badge variant="outline" className="ml-2">
                    {initialStudentIds.size}
                  </Badge>
                </h3>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                These students are already assigned. To unassign them, please do so from the main board.
              </p>
            </div>
                  </div>
                )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || selectedStudentIds.size === 0}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Assign {selectedStudentIds.size} Student{selectedStudentIds.size !== 1 && 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 