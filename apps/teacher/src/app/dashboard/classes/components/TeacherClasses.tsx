"use client";

import { useEffect, useState } from 'react';
import { ClassesTable } from './ClassesTable';
import { Class } from '@/utils/types';
import { CreateClassDialog } from '@/components/classes/CreateClassDialog';
import { motion } from 'framer-motion';
import { SchoolIcon, AlertCircle } from 'lucide-react';
import { Button } from '@intellect-kanban/ui';
import { toast } from 'sonner';

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
        toast.error(errorData.error || 'Failed to fetch classes');
        setError(errorData.error || 'Failed to fetch classes');
        setClasses([]);
        return;
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      toast.error('Failed to fetch classes');
      setError('Failed to fetch classes');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassCreated = (newClass: Class) => {
    // Add the new class to the existing classes
    setClasses(prevClasses => [newClass, ...prevClasses]);
  };

  return (
    <motion.div 
      className="space-y-6 mb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 px-2 sm:px-1">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <SchoolIcon size={22} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Classes</h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full sm:w-auto"
        >
          <CreateClassDialog onClassCreated={handleClassCreated} className="w-full sm:w-auto justify-center" />
        </motion.div>
      </div>

      {error && (
        <div className="text-center text-destructive mb-4">{error}</div>
      )}

      <ClassesTable classes={classes} isLoading={isLoading} />
    </motion.div>
  );
} 