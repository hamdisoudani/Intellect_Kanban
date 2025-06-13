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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@intellect-kanban/ui';
import { Search, Users, UserPlus, Loader2, Info, UserCheck, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/utils/types/classes';
import { cn } from '@intellect-kanban/utils';
import { useAssignmentsStore } from '@/store/assignmentsStore';

interface ManageStudentsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: any; // Make this optional since we'll use the store
  classStudents: User[];
  onStudentsUpdated?: () => void;
}

interface StudentRowProps {
    student: User | { _id?: string; id?: string; name: string };
    isSelected: boolean;
    onToggle?: (id: string) => void;
    isAlreadyAssigned?: boolean;
}

const StudentRow = ({ student, isSelected, onToggle, isAlreadyAssigned = false }: StudentRowProps) => {
  // Ensure we have a valid ID, checking both _id and id properties
  const studentId = (student as any)._id || (student as any).id || '';
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-colors",
        !isAlreadyAssigned && "cursor-pointer hover:bg-muted/50",
        isSelected && "bg-primary/10"
      )}
      onClick={() => !isAlreadyAssigned && onToggle && onToggle(studentId)}
    >
      {!isAlreadyAssigned ? (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle && onToggle(studentId)}
          aria-label={`Select ${student.name}`}
        />
      ) : (
        <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center">
          <UserCheck className="h-3 w-3" />
        </Badge>
      )}
      <Avatar className="h-8 w-8">
        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{student.name}</span>
    </div>
  );
};

export function ManageStudentsDialog({
  isOpen,
  onOpenChange,
  activity: propActivity, // Rename to propActivity to avoid confusion
  classStudents,
  onStudentsUpdated
}: ManageStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("unassigned");
  
  // Get data from the assignments store
  const { 
    getAssignedStudentsForActivity,
    selectedActivityData: storeActivity, // Get the activity from the store
    closeManageStudents
  } = useAssignmentsStore();
  
  // Use the activity from the store if available, otherwise fall back to the prop
  const activity = storeActivity || propActivity;

  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds(new Set());
      setSearchQuery('');
      setActiveTab("unassigned");
      console.log("The current activity in the manage student dialog is ", activity);
      console.log("Store activity:", storeActivity);
      console.log("Prop activity:", propActivity);
    }
  }, [isOpen, activity, storeActivity, propActivity]);

  // Get assigned and unassigned students
  const { assignedStudents, unassignedStudents } = useMemo(() => {
    // If no activity, return empty arrays
    if (!activity?._id) {
      console.log("[ManageStudentsDialog] No activity found, returning empty arrays");
      return { assignedStudents: [], unassignedStudents: classStudents };
    }
    
    // Get assigned students from the store
    const storeAssignedStudents = getAssignedStudentsForActivity(activity._id);
    console.log(`[ManageStudentsDialog] Assigned students from store for activity ${activity._id}:`, storeAssignedStudents);
    
    // Create a map of assigned student IDs for quick lookup
    const assignedStudentIdMap = new Map();
    storeAssignedStudents.forEach(student => {
      assignedStudentIdMap.set(student.id, true);
    });
    
    // Filter class students to get unassigned students
    const unassigned = classStudents.filter(student => {
      // Check if this student is in the assigned students list
      return !assignedStudentIdMap.has(student._id);
    });
    
    console.log("[ManageStudentsDialog] Unassigned students:", unassigned);
    
    return { 
      assignedStudents: storeAssignedStudents,
      unassignedStudents: unassigned
    };
  }, [activity, classStudents, getAssignedStudentsForActivity]);

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
    if (!activity?._id || selectedStudentIds.size === 0) {
      console.log("[ManageStudentsDialog] Cannot save: activity is null or no students selected");
      return;
    }
    
    setIsSubmitting(true);
    
    // Get all student IDs that should be assigned (existing + newly selected)
    const existingStudentIds = assignedStudents.map(student => student.id);
    const allStudentIds = [...existingStudentIds, ...selectedStudentIds];
    
    console.log("[ManageStudentsDialog] Saving with student IDs:", allStudentIds);
    
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

  // Use the custom onOpenChange handler to ensure we also update the store
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeManageStudents(); // Close in the store as well
    }
    onOpenChange(open); // Call the prop function
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-full flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6" />
            Manage Student Assignments
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            For activity: <span className="font-medium text-foreground">{activity?.title || 'Unknown Activity'}</span>
          </p>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="unassigned" className="flex gap-2 items-center">
              <UserPlus className="h-4 w-4" />
              Unassigned
              <Badge variant="secondary" className="ml-1">{unassignedStudents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex gap-2 items-center">
              <UserCheck className="h-4 w-4" />
              Assigned
              <Badge variant="secondary" className="ml-1">{assignedStudents.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="unassigned" className="flex-1 flex flex-col mt-4 data-[state=inactive]:hidden">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search unassigned students..."
                className="w-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <div className="p-3 bg-muted/30 border-b">
                <h3 className="text-base font-semibold flex items-center">
                  Available Students
                  <Badge variant="outline" className="ml-2">
                    {filteredStudents.length}
                  </Badge>
                </h3>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <StudentRow
                          key={`unassigned-${student._id}`}
                          student={student}
                          isSelected={selectedStudentIds.has(student._id)}
                          onToggle={handleToggleStudent}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 px-4">
                        <p className="text-muted-foreground">
                          {searchQuery ? 'No matching students found.' : 'All students are already assigned.'}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="assigned" className="flex-1 flex flex-col mt-4 data-[state=inactive]:hidden">
            <div className="flex-1 flex flex-col border rounded-md overflow-hidden">
              <div className="p-3 bg-muted/30 border-b">
                <h3 className="text-base font-semibold flex items-center">
                  Assigned Students
                  <Badge variant="outline" className="ml-2">
                    {assignedStudents.length}
                  </Badge>
                </h3>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-2">
                    {assignedStudents.length > 0 ? (
                      assignedStudents.map((student, index) => (
                        <StudentRow
                          key={`assigned-${student.id || index}`}
                          student={student}
                          isSelected={true}
                          isAlreadyAssigned={true}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 px-4">
                        <p className="text-muted-foreground">No students are currently assigned to this activity.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
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