"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Board, AssignmentWithMeta } from '@/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@intellect-kanban/ui';
import { BoardHeader } from './BoardHeader';
import { BoardColumns } from './BoardColumns';
import { ErrorDisplay } from './ErrorDisplay';
import { fetchBoard, fetchBoardAssignments } from '@/utils/api';
import { SocketProvider } from '@/contexts/SocketContext';

interface BoardViewProps {
  boardId: string;
}

interface BoardColumnsProps {
  board: Board;
  assignments: AssignmentWithMeta[];
  isLoading: boolean;
  onAssignmentUpdated: (assignment: AssignmentWithMeta) => void;
  onRefreshNeeded: () => void;
}

export function BoardView({ boardId }: BoardViewProps) {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithMeta[]>([]);
  const [isLoadingBoard, setIsLoadingBoard] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch board details
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setIsLoadingBoard(true);
        setError(null);
        
        const boardResult = await fetchBoard(boardId);
        setBoard(boardResult);
      } catch (err) {
        console.error('Error fetching board data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch board data');
        
        // If the board is not found, redirect to the dashboard
        if (err instanceof Error && err.message.includes('404')) {
          toast.error('Board not found');
          router.push('/dashboard');
          return;
        }
        
        toast.error('Error', {
          description: err instanceof Error ? err.message : 'Failed to fetch board data',
        });
      } finally {
        setIsLoadingBoard(false);
      }
    };

    fetchBoardData();
  }, [boardId, router]);

  // Function to fetch assignments
  const fetchAssignmentsData = useCallback(async () => {
    if (!boardId) return;
    
    try {
      setIsLoadingAssignments(true);
      
      const assignmentsResult = await fetchBoardAssignments(boardId);
      
      // Transform the assignments to match our AssignmentWithMeta interface
      const transformedAssignments = assignmentsResult.map((assignment: any) => {
        return {
          _id: assignment._id,
          activityId: assignment.activityId._id,
          studentId: assignment.studentId._id,
          boardId: assignment.boardId,
          columnId: assignment.columnId,
          position: assignment.position,
          notes: assignment.notes,
          
          // Copy activity data to top level
          title: assignment.activityId.title,
          description: assignment.activityId.description,
          dueDate: assignment.activityId.dueDate,
          difficultyLevel: assignment.activityId.difficultyLevel,
          estimatedTimeMinutes: assignment.activityId.estimatedTimeMinutes,
          tags: assignment.activityId.tags?.map((tag: any) => ({
            id: tag._id,
            label: tag.name,  // Map name field to label for frontend compatibility
            color: tag.color
          })) || [],
          priority: assignment.activityId.priority,
          attachments: assignment.activityId.attachments || [],
          feedback: assignment.feedback || [],
          
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        };
      });
      
      setAssignments(transformedAssignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      toast.error('Error', {
        description: 'Failed to fetch assignments. Please try again.',
      });
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [boardId]);

  // Fetch assignments for the board
  useEffect(() => {
    fetchAssignmentsData();
  }, [boardId, fetchAssignmentsData]);

  // Function to update a single assignment in the local state
  const updateLocalAssignment = useCallback((updatedAssignment: AssignmentWithMeta) => {
    setAssignments(prevAssignments => 
      prevAssignments.map(assignment => 
        assignment._id === updatedAssignment._id 
          ? { ...assignment, ...updatedAssignment } 
          : assignment
      )
    );
  }, []);

  // Function to refresh assignments only after significant changes
  // that might not be reflected through local updates
  const refreshAssignments = useCallback(() => {
    // Delay the refresh slightly to allow the UI to settle
    setTimeout(() => {
      fetchAssignmentsData();
    }, 800);
  }, [fetchAssignmentsData]);

  // Loading states
  if (isLoadingBoard) {
    return (
      <div className="w-full h-screen bg-background p-4">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((column) => (
            <div key={column} className="flex-shrink-0 w-[280px]">
              <Skeleton className="h-10 w-full mb-3" />
              <div className="space-y-3">
                {[1, 2, 3].map((card) => (
                  <Skeleton key={card} className="h-28 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !board) {
    return <ErrorDisplay error={error || "Failed to load board data"} />;
  }

  return (
    <SocketProvider boardId={boardId}>
      <div className="w-full min-h-screen flex flex-col">
        <BoardHeader board={board} />
        <div className="flex-1 h-[calc(100vh-56px)]">
          <BoardColumns 
            board={board} 
            assignments={assignments} 
            isLoading={isLoadingAssignments}
            onAssignmentUpdated={updateLocalAssignment}
            onRefreshNeeded={refreshAssignments}
          />
        </div>
      </div>
    </SocketProvider>
  );
} 