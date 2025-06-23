"use client";

import { useParams } from 'next/navigation';
import { KanbanBoardRefactored } from '@/components/board/KanbanBoardRefactored';
import { SocketProvider } from '@/contexts/SocketContext';
import Head from 'next/head';

export default function BoardPage() {
  // Use the useParams hook to get the id parameter
  const params = useParams<{ id: string }>();
  const id = params.id;

  return (
    <>
      <div className="flex flex-col h-[100dvh] w-screen max-h-[100dvh] max-w-screen overflow-hidden">
        <SocketProvider boardId={id}>
          <KanbanBoardRefactored boardId={id} />
        </SocketProvider>
      </div>
    </>
  );
} 