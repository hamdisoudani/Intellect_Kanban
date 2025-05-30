"use client";

import { KanbanBoard } from '@/components/board/KanbanBoard';
import { SocketProvider } from '@/contexts/SocketContext';

type BoardPageProps = {
  params: { id: string };
};


export default function BoardPage({ params }: BoardPageProps) {
  const { id } = params;

  return (
    <div className="flex flex-col">
      <SocketProvider boardId={id}>
        <KanbanBoard boardId={id} />
      </SocketProvider>
    </div>
  );
} 