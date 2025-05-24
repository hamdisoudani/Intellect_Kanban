import { DashboardPage } from '@intellect-kanban/ui';
import { TeacherClasses } from './components/TeacherClasses';

export const metadata = {
  title: 'Intellect Kanban - Teacher Classes',
  description: 'Manage your classes and student activities',
};

export default function ClassesPage() {
  return (
    <DashboardPage title="Classes">
      <TeacherClasses />
    </DashboardPage>
  );
} 