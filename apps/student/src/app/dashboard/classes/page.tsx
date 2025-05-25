import { DashboardPage } from '@intellect-kanban/ui';
import { StudentClasses } from '@/components';

export const metadata = {
  title: 'Intellect Kanban - Student Classes',
  description: 'View your joined classes and assignments',
};

export default function ClassesPage() {
  return (
    <DashboardPage title="" className="!pt-0">
      <StudentClasses />
    </DashboardPage>
  );
} 