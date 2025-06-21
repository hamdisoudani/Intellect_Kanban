import { DashboardPage } from '@intellect-kanban/ui';
import { TeacherClasses } from './components/TeacherClasses';

export const metadata = {
  title: 'Intellect Kanban - Teacher Classes',
  description: 'Manage your classes and student activities',
};

export default function ClassesPage() {
  return (
    <DashboardPage title="" className="!pt-4 !pb-8 !px-0 sm:!px-2 md:!px-4 lg:!px-6">
      <TeacherClasses />
    </DashboardPage>
  );
} 