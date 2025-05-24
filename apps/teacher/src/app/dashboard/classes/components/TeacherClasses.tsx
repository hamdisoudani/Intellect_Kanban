"use client";

import { useEffect, useState } from 'react';
import { ClassGrid } from './ClassGrid';
import { Class } from '@/utils/types';
import { CreateClassDialog } from '@/components/classes/CreateClassDialog';

export function TeacherClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/classes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassCreated = (newClass: Class) => {
    // Add the new class to the existing classes
    setClasses(prevClasses => [newClass, ...prevClasses]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Your Classes</h2>
        <CreateClassDialog onClassCreated={handleClassCreated} />
      </div>

      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <ClassGrid classes={classes} isLoading={isLoading} />
    </div>
  );
} 