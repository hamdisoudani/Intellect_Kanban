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

interface BoardColumnsProps {
  board: Board;
  assignments: AssignmentWithMeta[];
  isLoading: boolean;
}

export function BoardColumns({ board, assignments, isLoading }: BoardColumnsProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithMeta | null>(null);
  const [draggingAssignment, setDraggingAssignment] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  // Group assignments by column
  const assignmentsByColumn = board.columns.reduce<Record<string, AssignmentWithMeta[]>>(
    (acc, column) => {
      acc[column.id] = assignments.filter(
        assignment => assignment.columnId === column.id
      ).sort((a, b) => a.position - b.position);
      return acc;
    }, 
    {}
  );

  // Handle opening assignment detail
  const handleOpenAssignment = (assignment: AssignmentWithMeta) => {
    setSelectedAssignment(assignment);
  };

  // Handle closing assignment detail
  const handleCloseAssignment = () => {
    setSelectedAssignment(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignmentId: string, columnId: string) => {
    e.dataTransfer.setData('assignmentId', assignmentId);
    e.dataTransfer.setData('fromColumn', columnId);
    setDraggingAssignment(assignmentId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setIsDraggingOver(columnId);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    const assignmentId = e.dataTransfer.getData('assignmentId');
    const fromColumn = e.dataTransfer.getData('fromColumn');

    if (assignmentId && fromColumn && fromColumn !== columnId) {
      // Placeholder for API call - would update assignment's column in a real implementation
      toast.success(`Moved assignment to ${board.columns.find(col => col.id === columnId)?.name}`);
      
      // Reset states
      setDraggingAssignment(null);
      setIsDraggingOver(null);
    }
  };

  const handleDragEnd = () => {
    setDraggingAssignment(null);
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
          
          return (
            <motion.div
              key={column.id} 
              variants={columnVariants}
              style={{ width: columnWidth }}
              className="h-full max-h-full"
            >
              <Card 
                className={`h-full flex flex-col transition-colors shadow-sm overflow-hidden ${isOver ? 'ring-2 ring-primary ring-inset' : ''}`}
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