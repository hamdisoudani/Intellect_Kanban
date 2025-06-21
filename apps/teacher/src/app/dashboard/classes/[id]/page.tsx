import { DashboardPage } from '@intellect-kanban/ui';
import { ClassDetail } from '@/components/class-details/ClassDetail';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ClassDetailPageProps {
  params: { id: string };
}

export const metadata = {
  title: 'Intellect Kanban - Class Detail',
  description: 'Manage your class details, students and boards',
};

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  return (
    <DashboardPage title="" className="!pt-4 !pb-8 !px-1 sm:!px-2 md:!px-4 lg:!px-6">
      <ClassDetail classId={params.id} />
    </DashboardPage>
  );
} 