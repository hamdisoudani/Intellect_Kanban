"use client";

import { useEffect, useState } from 'react';
import { ClassGrid } from './ClassGrid';
import { Class } from '@/utils/types';
import { CreateClassDialog } from '@/components/classes/CreateClassDialog';
import { motion } from 'framer-motion';
import { SchoolIcon } from 'lucide-react';

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
    <div className="space-y-8">
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <SchoolIcon size={20} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        </div>
        <CreateClassDialog onClassCreated={handleClassCreated} />
      </motion.div>

      {error && (
        <motion.div 
          className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.div>
      )}

      <ClassGrid classes={classes} isLoading={isLoading} />
    </div>
  );
} 