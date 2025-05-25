"use client";

import { useState } from 'react';
import { Board, AssignmentWithMeta } from '@/types';
import { 
  Skeleton,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  ScrollArea
} from '@intellect-kanban/ui';
import { toast } from 'sonner';
import AssignmentCard from './AssignmentCard';
import { AssignmentDetail } from './AssignmentDetail';
import { LayoutList } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateAssignmentColumn } from '@/utils/api';

interface BoardColumnsProps {
  board: Board;
  assignments: AssignmentWithMeta[];
  isLoading: boolean;
  onAssignmentUpdated?: (assignment: AssignmentWithMeta) => void;
  onRefreshNeeded?: () => void;
}

export function BoardColumns({ 
  board, 
  assignments, 
  isLoading, 
  onAssignmentUpdated, 
  onRefreshNeeded 
}: BoardColumnsProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithMeta | null>(null);
  const [draggingAssignment, setDraggingAssignment] = useState<string | null>(null);
  const [draggingFromColumn, setDraggingFromColumn] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
  const [localAssignments, setLocalAssignments] = useState<AssignmentWithMeta[]>(assignments);
  const [pendingUpdateAssignments, setPendingUpdateAssignments] = useState<Record<string, boolean>>({});
  
  // Group assignments by column for more efficient updates and rendering
  const assignmentsByColumn = board.columns.reduce<Record<string, AssignmentWithMeta[]>>(
    (acc, column) => {
      acc[column.id] = localAssignments
        .filter(assignment => assignment.columnId === column.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    }, 
    {}
  );

  // Update local assignments when props assignments change (but not during a drag operation)
  if (!draggingAssignment && JSON.stringify(assignments.map(a => a._id)) !== JSON.stringify(localAssignments.map(a => a._id))) {
    setLocalAssignments(assignments);
  }

  // Handle opening assignment detail
  const handleOpenAssignment = (assignment: AssignmentWithMeta) => {
    // Don't open if assignment is being updated
    if (pendingUpdateAssignments[assignment._id]) {
      return;
    }
    setSelectedAssignment(assignment);
  };

  // Handle closing assignment detail
  const handleCloseAssignment = () => {
    setSelectedAssignment(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignmentId: string, columnId: string) => {
    // Don't allow dragging assignments that are pending update
    if (pendingUpdateAssignments[assignmentId]) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('assignmentId', assignmentId);
    e.dataTransfer.setData('fromColumn', columnId);
    e.dataTransfer.effectAllowed = 'move';
    
    setDraggingAssignment(assignmentId);
    setDraggingFromColumn(columnId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (isDraggingOver !== columnId) {
      setIsDraggingOver(columnId);
    }
  };

  const handleDragLeave = () => {
    setIsDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setIsDraggingOver(null);
    
    const assignmentId = e.dataTransfer.getData('assignmentId');
    const fromColumn = e.dataTransfer.getData('fromColumn');

    if (!assignmentId || !fromColumn || fromColumn === columnId) {
      return;
    }
    
    // Find the assignment that's being moved
    const assignment = localAssignments.find(a => a._id === assignmentId);
    if (!assignment) return;
    
    // Reset drag states
    setDraggingAssignment(null);
    setDraggingFromColumn(null);
    
    // Mark this assignment as pending update
    setPendingUpdateAssignments(prev => ({
      ...prev,
      [assignmentId]: true
    }));
    
    // Calculate the new position - find highest position in target column and add 1
    const assignmentsInTargetColumn = localAssignments.filter(a => a.columnId === columnId);
    const highestPosition = assignmentsInTargetColumn.length > 0
      ? Math.max(...assignmentsInTargetColumn.map(a => a.position))
      : -1;
    const newPosition = highestPosition + 1;
    
    console.log(`Setting position to ${newPosition} in column ${columnId}`);
    
    // Create updated assignment with new column ID and position
    const updatedAssignment = { 
      ...assignment, 
      columnId,
      position: newPosition 
    };
    
    // Update local state optimistically
    setLocalAssignments(prev => 
      prev.map(a => a._id === assignmentId ? updatedAssignment : a)
    );
    
    // Show loading notification using toastId for updating later
    const toastId = toast.loading('Updating assignment...');
    
    console.log(`BoardColumns: Updating assignment ${assignmentId} from column ${fromColumn} to ${columnId} at position ${newPosition}`);
    
    // Call API to update the assignment's column and position
    updateAssignmentColumn(assignmentId, columnId, newPosition)
      .then((response) => {
        console.log('BoardColumns: Update successful', response);
        // Update successful
        toast.success('Assignment moved successfully', { id: toastId });
        
        // Remove pending status
        setPendingUpdateAssignments(prev => ({
          ...prev,
          [assignmentId]: false
        }));
        
        // Update local state with the response from the server
        if (onAssignmentUpdated && response) {
          // Create a complete assignment with metadata
          const updatedWithMeta: AssignmentWithMeta = {
            ...updatedAssignment,
            ...response,
            // Keep metadata that might not be in the response
            columnId: response.columnId || columnId, // Ensure columnId is updated
            position: response.position || newPosition, // Ensure position is updated
            title: updatedAssignment.title,
            description: updatedAssignment.description,
            tags: updatedAssignment.tags,
            priority: updatedAssignment.priority,
            attachments: updatedAssignment.attachments,
            difficultyLevel: updatedAssignment.difficultyLevel,
            estimatedTimeMinutes: updatedAssignment.estimatedTimeMinutes,
            dueDate: updatedAssignment.dueDate,
            feedback: updatedAssignment.feedback
          };
          
          onAssignmentUpdated(updatedWithMeta);
        }
      })
      .catch(error => {
        console.error('BoardColumns: Error updating assignment column:', error);
        toast.error(`Update failed: ${error.message || 'Unknown error'}`, { id: toastId });
        
        // Revert the UI change on error
        setLocalAssignments(assignments);
        
        // Remove pending status
        setPendingUpdateAssignments(prev => ({
          ...prev,
          [assignmentId]: false
        }));
        
        // If there's a refresh function provided, call it in case
        // we need to sync with the server after an error
        if (onRefreshNeeded) {
          onRefreshNeeded();
        }
      });
  };

  const handleDragEnd = () => {
    setDraggingAssignment(null);
    setDraggingFromColumn(null);
    setIsDraggingOver(null);
  };

  // Animation variants for columns
  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  // Animation variants for container
  const containerVariants = {
    hidden: {},
    visible: { 
      transition: { staggerChildren: 0.1 }
    }
  };

  // Calculate column width based on number of columns
  const columnWidth = `calc((100% / ${board.columns.length}) - ${(board.columns.length - 1) * 12 / board.columns.length}px)`;

  if (isLoading) {
    return (
      <div className="flex gap-2 px-4 py-2 w-full overflow-hidden">
        {board.columns.map((column) => (
          <div key={column.id} style={{ width: columnWidth }} className="h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 border-b">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">{column.name}</CardTitle>
                  <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">0</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2 flex-grow">
                <div className="space-y-2">
                  {[1, 2].map((item) => (
                    <Skeleton key={item} className="h-28 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-3 px-4 py-2 pb-6 w-full overflow-x-auto"
        style={{ 
          height: 'calc(100vh - 64px)',
          maxWidth: '100%'
        }}
      >
        {board.columns.map((column) => {
          const columnAssignments = assignmentsByColumn[column.id] || [];
          const isOver = isDraggingOver === column.id;
          const isDragTarget = draggingAssignment && draggingFromColumn !== column.id;
          
          return (
            <motion.div
              key={column.id} 
              variants={columnVariants}
              style={{ width: columnWidth }}
              className="h-full max-h-full"
            >
              <Card 
                className={`h-full flex flex-col transition-colors shadow-sm overflow-hidden ${
                  isOver ? 'ring-2 ring-primary ring-inset' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <CardHeader className="py-2 px-3 flex flex-row items-center justify-between space-y-0 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{column.name}</CardTitle>
                    <Badge variant="outline" className="font-normal text-xs h-5 px-1.5">
                      {columnAssignments.length}
                    </Badge>
                  </div>
                </CardHeader>
                
                <ScrollArea className="flex-grow w-full overflow-hidden">
                  <CardContent className="p-3 h-full">
                    <div className="space-y-3 pb-4 pr-1">
                      {columnAssignments.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-sm text-muted-foreground p-3 h-20">
                          <div className="text-center">
                            <LayoutList className="h-4 w-4 mx-auto mb-1" />
                            <span className="text-xs">No assignments</span>
                          </div>
                        </div>
                      ) : (
                        columnAssignments.map((assignment) => (
                          <div 
                            key={assignment._id}
                            className="cursor-pointer"
                            onClick={() => handleOpenAssignment(assignment)}
                          >
                            <AssignmentCard
                              id={assignment._id}
                              activityId={{
                                title: assignment.title,
                                description: assignment.description,
                                dueDate: assignment.dueDate,
                                tags: assignment.tags,
                                difficultyLevel: assignment.difficultyLevel,
                                estimatedTimeMinutes: assignment.estimatedTimeMinutes,
                                attachments: assignment.attachments
                              }}
                              columnId={column.id}
                              position={assignment.position}
                              status={assignment.columnId === 'done' ? 'COMPLETED' : assignment.dueDate && new Date(assignment.dueDate) < new Date() ? 'OVERDUE' : 'IN_PROGRESS'}
                              isDragging={draggingAssignment === assignment._id}
                              isPendingUpdate={pendingUpdateAssignments[assignment._id]}
                              onDragStart={(e) => handleDragStart(e, assignment._id, column.id)}
                              onDragEnd={handleDragEnd}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </ScrollArea>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {selectedAssignment && (
        <AssignmentDetail
          assignment={selectedAssignment}
          onClose={handleCloseAssignment}
        />
      )}
    </>
  );
} 