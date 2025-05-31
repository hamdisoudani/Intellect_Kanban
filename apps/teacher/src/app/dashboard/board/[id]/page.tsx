"use client";

import { useParams } from 'next/navigation';
import { KanbanBoardRefactored } from '@/components/board/KanbanBoardRefactored';
import { SocketProvider } from '@/contexts/SocketContext';

export default function BoardPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <div className="flex flex-col">
      <SocketProvider boardId={id}>
        <KanbanBoardRefactored boardId={id} />
      </SocketProvider>
    </div>
  );
} 