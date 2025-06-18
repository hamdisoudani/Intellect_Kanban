"use client";

import { useState, useEffect } from 'react';
import { Skeleton, Button, ScrollArea, Card, CardContent, Separator, Badge, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@intellect-kanban/ui';
import { ClassStudentsTab } from './ClassStudentsTab';
import { ClassBoardsTab } from './ClassBoardsTab';
import { toast } from 'sonner';
import { Class, Board } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { InfoIcon, LayoutDashboardIcon, UsersIcon, PlusIcon, AlertTriangleIcon, TrashIcon, ClipboardCopyIcon, CheckIcon, LinkIcon, EyeIcon, EyeOffIcon, ShieldAlertIcon, ChevronLeft } from 'lucide-react';
import { CreateBoardDialog } from '../boards/CreateBoardDialog';
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
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Separate effect for fetching boards - always fetch boards independently
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

  // Updated handler for deleting the class with loading state
  const handleDeleteClass = async () => {
    try {
      setIsDeleting(true);
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
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!classData) return;
    
    navigator.clipboard.writeText(classData.invitationCode);
    setIsCopied(true);
    toast.success('Invitation code copied to clipboard');
    
    // Reset the copy icon after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleCopyInviteLink = () => {
    if (!classData) return;
    
    const inviteLink = `${window.location.origin}/join?code=${classData.invitationCode}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invitation link copied to clipboard');
  };

  const handleBoardCreated = (newBoard: Board) => {
    console.log("New board created:", newBoard);
    // Ensure we're adding the new board to the existing boards array
    setBoards(prevBoards => [...prevBoards, newBoard]);
  };

  // Show global error state
  if (error) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 text-red-800 rounded-md">
        {error}
      </div>
    );
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Enhanced Header with Title and Invitation Code */}
      <div className="pb-4 mb-4 border-b border-border/30">
        {/* Back to Classes Link - Now part of the header */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/classes')}
            className="text-muted-foreground hover:text-foreground gap-1 px-1.5 h-8"
          >
            <ChevronLeft size={16} />
            <span>Back to Classes</span>
          </Button>
        </div>
        
        {/* Responsive header with class info and actions */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          {/* Class Name and Info */}
          <div className="flex items-center gap-3 md:w-auto w-full">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center text-primary">
              <InfoIcon size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {isLoadingClass ? <Skeleton className="h-8 w-64" /> : classData?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {!isLoadingClass && classData && 
                  `Created on ${new Date(classData.createdAt).toLocaleDateString()} • ${classData.joinedUsers.length} students`
                }
              </p>
            </div>
          </div>
          
          {/* Responsive container for invitation code and buttons */}
          <div className="flex flex-col sm:flex-row items-start gap-3 w-full md:w-auto">
            {/* Invitation Code */}
            {!isLoadingClass && classData && (
              <div className="w-full sm:w-auto">
                <div className="bg-muted/40 px-2 py-1 rounded-md flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-full">
                  <span className="text-xs text-muted-foreground sm:mr-1">Invitation:</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                    <div className="relative flex-1 min-w-0 max-w-full w-full sm:w-auto">
                      <code className="bg-background px-3 py-1.5 rounded text-sm font-mono w-full truncate pr-8 inline-block border shadow-sm">
                        {showInviteCode ? classData.invitationCode : '••••••••'}
                      </code>
                      <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-5 w-5 p-0"
                          onClick={() => setShowInviteCode(!showInviteCode)}
                          title={showInviteCode ? "Hide code" : "Show code"}
                        >
                          {showInviteCode ? 
                            <EyeOffIcon size={14} className="text-muted-foreground" /> : 
                            <EyeIcon size={14} className="text-muted-foreground" />
                          }
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopyInviteCode}
                        title="Copy Invitation Code"
                      >
                        {isCopied ? <CheckIcon size={14} /> : <ClipboardCopyIcon size={14} />}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleCopyInviteLink}
                        className="h-7 text-xs whitespace-nowrap"
                      >
                        <LinkIcon size={14} className="mr-1" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content Area with Boxed Containers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Boards in a Card */}
        <Card className="md:col-span-2">
          <CardContent className="p-2 sm:p-3 md:p-5">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <LayoutDashboardIcon size={16} className="text-primary" />
                  <h2 className="font-semibold">Kanban Boards</h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs mr-2">
                    {boards.length} {boards.length === 1 ? 'board' : 'boards'}
                  </Badge>
                  
                  {!isLoadingClass && classData && (
                    <CreateBoardDialog 
                      onBoardCreated={handleBoardCreated}
                      classId={classId}
                      size="sm"
                    />
                  )}
                </div>
              </div>
              
              <div className="w-full">
                {isLoadingBoards ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-28 w-full" />
                    ))}
                  </div>
                ) : (
                  <ClassBoardsTab 
                    boards={boards} 
                    classId={classId}
                    isLoading={isLoadingBoards}
                  />
                )}
              </div>
            </motion.div>
          </CardContent>
        </Card>

        {/* Right Column: Students in a Card */}
        <Card>
          <CardContent className="p-2 sm:p-3 md:p-5">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UsersIcon size={16} className="text-primary" />
                  <h2 className="font-semibold">Students</h2>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {!isLoadingClass && classData ? 
                    `${classData.joinedUsers.length} ${classData.joinedUsers.length === 1 ? 'student' : 'students'}` : 
                    "Loading..."
                  }
                </Badge>
              </div>
              
              <div className="max-h-[600px] overflow-hidden">
                <ScrollArea className="h-full pr-3">
                  {isLoadingClass ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : classData && (
                    <ClassStudentsTab 
                      students={classData.joinedUsers} 
                      onRemoveStudent={handleRemoveStudent} 
                    />
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
      
      {/* Danger Zone - improved with confirmation dialog */}
      {!isLoadingClass && classData && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mt-8 mb-4"
        >
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <ShieldAlertIcon className="h-5 w-5 text-destructive" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-base mb-1 text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Actions performed here can lead to permanent data loss and cannot be undone.
                  </p>
                  
                  <div className="p-3 border border-dashed border-destructive/30 rounded-md bg-destructive/5 flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium">Delete this class</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This will permanently delete all boards, activities, and student data associated with this class.
                      </p>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="whitespace-nowrap h-8"
                    >
                      <TrashIcon size={14} className="mr-1.5" />
                      Delete Class
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the class 
                  <span className="font-medium"> "{classData.name}" </span> 
                  and all of its associated data including boards, activities, and student assignments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteClass();
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="mr-2">Deleting...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    'Yes, delete class'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      )}
    </div>
  );
} 