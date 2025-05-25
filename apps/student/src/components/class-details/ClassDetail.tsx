"use client";

import { useState, useEffect } from 'react';
import { Skeleton, Card, CardContent } from '@intellect-kanban/ui';
import { ClassBoardsView } from './ClassBoardsView';
import { toast } from 'sonner';
import { Class, Board } from '@/types';
import { useRouter } from 'next/navigation';
import { InfoIcon, BookOpenText } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClassDetailProps {
  classId: string;
}

export function ClassDetail({ classId }: ClassDetailProps) {
  const router = useRouter();
  const [classData, setClassData] = useState<Class | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingClass, setIsLoadingClass] = useState(true);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch class details
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setIsLoadingClass(true);
        setError(null);
        
        // Fetch class details
        const classResponse = await fetch(`/api/classes/${classId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!classResponse.ok) {
          // If the class is not found, redirect to the classes list
          if (classResponse.status === 404) {
            toast.error('Class not found');
            router.push('/dashboard/classes');
            return;
          }
          
          const errorData = await classResponse.json();
          throw new Error(errorData.error || 'Failed to fetch class details');
        }

        const classResult = await classResponse.json();
        setClassData(classResult);
      } catch (err) {
        console.error('Error fetching class data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch class data');
        toast.error('Error', {
          description: err instanceof Error ? err.message : 'Failed to fetch class data',
        });
      } finally {
        setIsLoadingClass(false);
      }
    };

    fetchClassData();
  }, [classId, router]);

  // Separate effect for fetching boards
  useEffect(() => {
    const fetchBoards = async () => {
      if (!classId) return;
      
      try {
        setIsLoadingBoards(true);
        
        const boardsResponse = await fetch(`/api/boards/class/${classId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!boardsResponse.ok) {
          const errorData = await boardsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch class boards');
        }

        const boardsResult = await boardsResponse.json();
        setBoards(boardsResult);
      } catch (err) {
        console.error('Error fetching boards:', err);
        toast.error('Error', {
          description: 'Failed to fetch boards. Please try again.',
        });
      } finally {
        setIsLoadingBoards(false);
      }
    };

    fetchBoards();
  }, [classId]);

  // Loading skeleton UI
  if (isLoadingClass || isLoadingBoards) {
    return (
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex items-center space-x-4"
        >
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !classData) {
    return (
      <Card className="bg-red-50/50 border-red-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="bg-red-100 p-2 rounded-full">
              <InfoIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">
                {error || "Failed to load class data"}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please try again later or contact support if the problem persists.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Class Information */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4 pb-4 border-b border-border/30"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mt-1">
          <BookOpenText size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{classData.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Teacher: {classData.createdBy?.name || 'Unknown Teacher'}
          </p>
        </div>
      </motion.div>

      {/* Boards Section - No heading, go straight to boards */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ClassBoardsView boards={boards} />
      </motion.div>
    </div>
  );
} 