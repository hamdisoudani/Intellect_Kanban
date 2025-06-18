import { DashboardPage } from '@intellect-kanban/ui';
import { TeacherClasses } from './components/TeacherClasses';

export const metadata = {
  title: 'Intellect Kanban - Teacher Classes',
  description: 'Manage your classes and student activities',
};

export default function ClassesPage() {
  return (
    <DashboardPage title="" className="!pt-4 !pb-8 !px-2 sm:!px-3 md:!px-6 lg:!px-8">
      <TeacherClasses />
    </DashboardPage>
  );
} 