"use client";

import { ClassCard } from './ClassCard';
import { Class } from '@/utils/types';
import { useRouter } from 'next/navigation';

interface ClassGridProps {
  classes: Class[];
  isLoading?: boolean;
}

export function ClassGrid({ classes, isLoading = false }: ClassGridProps) {
  const router = useRouter();

  const handleManageClass = (classId: string) => {
    router.push(`/dashboard/classes/${classId}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div 
            key={i}
            className="h-52 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (classes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium mb-2">No classes yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first class to get started
        </p>
      </div>
    );
  }

  // Classes grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem) => (
        <ClassCard
          key={classItem._id}
          classData={classItem}
          onManage={handleManageClass}
        />
      ))}
    </div>
  );
} 