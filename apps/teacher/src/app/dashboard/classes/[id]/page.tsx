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
    <DashboardPage title="" className="!pt-4 !pb-8 !px-2 sm:!px-3 md:!px-6 lg:!px-8">
      <ClassDetail classId={params.id} />
    </DashboardPage>
  );
} 