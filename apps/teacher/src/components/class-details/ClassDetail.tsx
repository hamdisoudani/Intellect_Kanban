"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from '@intellect-kanban/ui';
import { ClassInfoTab } from './ClassInfoTab';
import { ClassStudentsTab } from './ClassStudentsTab';
import { ClassBoardsTab } from './ClassBoardsTab';
import { toast } from 'sonner';
import { Class, Board } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { InfoIcon, LayoutDashboardIcon, UsersIcon } from 'lucide-react';
import { CreateBoardDialog } from '../boards/CreateBoardDialog';

interface ClassDetailProps {
  classId: string;
}

export function ClassDetail({ classId }: ClassDetailProps) {
  const router = useRouter();
  const [classData, setClassData] = useState<Class | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoadingClass, setIsLoadingClass] = useState(true);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');

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

  // Separate effect for fetching boards - only when needed
  useEffect(() => {
    // Only fetch boards when the boards tab is active or when first loading the component
    if (activeTab === 'boards' || (!boards.length && classData)) {
      const fetchBoards = async () => {
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
    }
  }, [activeTab, classId, classData, boards.length]);

  // Handler for removing a student from the class
  const handleRemoveStudent = async (studentId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove student');
      }

      // Update the class data by removing the student
      if (classData) {
        const updatedStudents = classData.joinedUsers.filter(
          (student) => student._id !== studentId
        );
        
        setClassData({
          ...classData,
          joinedUsers: updatedStudents,
        });
        
        toast.success('Student removed successfully');
      }
    } catch (err) {
      console.error('Error removing student:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to remove student',
      });
    }
  };

  // Handler for deleting the class
  const handleDeleteClass = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }

      toast.success('Class deleted successfully');
      
      // Redirect to classes list
      router.push('/dashboard/classes');
    } catch (err) {
      console.error('Error deleting class:', err);
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to delete class',
      });
    }
  };

  // Show loading state - more detailed skeleton based on the content
  if (isLoadingClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-9 w-32" />
        </div>
        
        <div className="border rounded-md p-1">
          <Skeleton className="h-10 w-full" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !classData) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
        {error || 'Failed to load class data'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
        <div className="flex gap-2">
          <CreateBoardDialog 
            onBoardCreated={(newBoard: Board) => {
              // Add the new board to the existing boards
              setBoards([...boards, newBoard]);
              // Optionally switch to the boards tab
              setActiveTab('boards');
            }}
            classId={classId}
          />
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-background border">
          <TabsTrigger value="info" className="data-[state=active]:bg-primary/10">
            <InfoIcon className="mr-2 h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-primary/10">
            <UsersIcon className="mr-2 h-4 w-4" />
            Students
            <span className="ml-2 bg-muted rounded-full px-2 py-0.5 text-xs">
              {classData.joinedUsers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="boards" className="data-[state=active]:bg-primary/10">
            <LayoutDashboardIcon className="mr-2 h-4 w-4" />
            Boards
            {isLoadingBoards ? (
              <Skeleton className="ml-2 w-6 h-5 rounded-full" />
            ) : (
              <span className="ml-2 bg-muted rounded-full px-2 py-0.5 text-xs">
                {boards.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info">
          <ClassInfoTab 
            classData={classData} 
            onDeleteClass={handleDeleteClass} 
          />
        </TabsContent>
        
        <TabsContent value="students">
          <ClassStudentsTab 
            students={classData.joinedUsers} 
            onRemoveStudent={handleRemoveStudent} 
          />
        </TabsContent>
        
        <TabsContent value="boards">
          {isLoadingBoards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
            <ClassBoardsTab 
              boards={boards} 
              classId={classId}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 