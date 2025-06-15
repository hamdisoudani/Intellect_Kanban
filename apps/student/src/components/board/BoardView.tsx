"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@intellect-kanban/ui';
import { BoardHeader } from './BoardHeader';
import { BoardColumns } from './BoardColumns';
import { ErrorDisplay } from './ErrorDisplay';
import { useBoardStore } from '@/store/boardStore';
import { useSocketStore } from '@/store/socketStore';

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const router = useRouter();
  const initialFetchDone = useRef(false);
  
  // Connect to Zustand stores
  const {
    board,
    assignments,
    isLoadingBoard,
    isLoadingAssignments,
    error,
    fetchBoardData,
    updateAssignment,
  } = useBoardStore();

  const { connectToBoard, disconnect, isConnected } = useSocketStore();
  const { data: session, status } = useSession();

  // Fetch initial data and connect to socket
  useEffect(() => {
    if (boardId) {
      // Only fetch data once per session to avoid unnecessary reloads
      if (!initialFetchDone.current) {
        fetchBoardData(boardId)
        initialFetchDone.current = true;
      }
      
      // Only connect if not already connected
      //connectToBoard(boardId, session.user.accessToken);
    }
    
    // Only disconnect socket when component unmounts completely
    return () => {
      // We could keep the socket alive, but for now we'll disconnect on unmount
      // to ensure clean state transitions between different boards
      //disconnect();
      // Reset the ref when component unmounts
      initialFetchDone.current = false;
    };
  }, [boardId, fetchBoardData]);
  // Connect to WebSocket when board data is loaded and user is authenticated
  useEffect(() => {
    if (board && status === "authenticated" && session?.user?.accessToken && !isConnected) {
      connectToBoard(board._id, session.user.accessToken);
    }
    return () => {
      disconnect();
    }
  }, [board, session, connectToBoard]);

  

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
            onAssignmentUpdated={updateAssignment} // Pass update function from store
            onRefreshNeeded={() => fetchBoardData(boardId)} // Pass refresh function
          />
        </div>
      </div>
  );
} 