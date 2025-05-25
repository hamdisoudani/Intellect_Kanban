import { KanbanBoard } from '@/components/board/KanbanBoard';

type BoardPageProps = {
  params: { id: string };
};

export const metadata = {
  title: 'Intellect Kanban - Board',
  description: 'Manage your Kanban board activities',
};

export default async function BoardPage({ params }: BoardPageProps) {
  // Await params before accessing its properties
  const { id } = await params;

  return (
    <div className="flex flex-col">
      <KanbanBoard boardId={id} />
    </div>
  );
} 