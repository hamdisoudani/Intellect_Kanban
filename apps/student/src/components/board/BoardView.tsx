"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Board, AssignmentWithMeta } from '@/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@intellect-kanban/ui';
import { BoardHeader } from './BoardHeader';
import { BoardColumns } from './BoardColumns';
import { ErrorDisplay } from './ErrorDisplay';

interface BoardViewProps {
  boardId: string;
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
        
        const boardResponse = await fetch(`/api/boards/${boardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!boardResponse.ok) {
          // If the board is not found, redirect to the dashboard
          if (boardResponse.status === 404) {
            toast.error('Board not found');
            router.push('/dashboard');
            return;
          }
          
          const errorData = await boardResponse.json();
          throw new Error(errorData.error || 'Failed to fetch board details');
        }

        const boardResult = await boardResponse.json();
        setBoard(boardResult);
      } catch (err) {
        console.error('Error fetching board data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch board data');
        toast.error('Error', {
          description: err instanceof Error ? err.message : 'Failed to fetch board data',
        });
      } finally {
        setIsLoadingBoard(false);
      }
    };

    fetchBoardData();
  }, [boardId, router]);

  // Fetch assignments for the board
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!boardId) return;
      
      try {
        setIsLoadingAssignments(true);
        
        const assignmentsResponse = await fetch(`/api/assignments/board/${boardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!assignmentsResponse.ok) {
          const errorData = await assignmentsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch board assignments');
        }

        const assignmentsResult = await assignmentsResponse.json();
        
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
            
            createdAt: assignment.createdAt,
            updatedAt: assignment.updatedAt
          };
        });
        
        // console.log('Transformed assignments:', transformedAssignments);
        setAssignments(transformedAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        toast.error('Error', {
          description: 'Failed to fetch assignments. Please try again.',
        });
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, [boardId]);

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
    <div className="w-full min-h-screen flex flex-col">
      <BoardHeader board={board} />
      <div className="flex-1 h-[calc(100vh-56px)]">
        <BoardColumns 
          board={board} 
          assignments={assignments} 
          isLoading={isLoadingAssignments} 
        />
      </div>
    </div>
  );
} 