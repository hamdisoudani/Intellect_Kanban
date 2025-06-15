import { BoardView } from '@/components/board';

type BoardPageProps = {
  params: { id: string };
};

export const metadata = {
  title: 'Intellect Kanban - Board',
  description: 'View your assignments board',
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;

  return (
    <div className="flex flex-col">
      <BoardView boardId={id} />
    </div>
  );
} 