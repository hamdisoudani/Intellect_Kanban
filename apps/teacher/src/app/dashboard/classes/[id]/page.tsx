import { DashboardPage } from '@intellect-kanban/ui';
import { ClassDetail } from '@/components/class-details/ClassDetail';
import Link from 'next/link';
import { ArrowLeftIcon } from 'lucide-react';

type ClassDetailPageProps = {
  params: { id: string };
};

export const metadata = {
  title: 'Intellect Kanban - Class Detail',
  description: 'Manage your class details, students and boards',
};

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
  // Await params before accessing its properties
  const { id } = await params;

  return (
    <DashboardPage title="">
      <div className="mb-4">
        <Link 
          href="/dashboard/classes" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Classes
        </Link>
      </div>
      <ClassDetail classId={id} />
    </DashboardPage>
  );
} 