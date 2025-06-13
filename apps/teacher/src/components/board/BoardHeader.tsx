"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Separator
} from '@intellect-kanban/ui';
import { Board } from '@/utils/types';
import { 
  SettingsIcon, 
  ChevronLeftIcon, 
  PlusCircleIcon,
  PencilIcon,
  CheckIcon,
  User,
  Users,
  LogOut,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getSession, logout } from '@/server/auth-actions';
import { BoardStudents } from './BoardStudents';
import { cn } from '@intellect-kanban/utils';

interface BoardHeaderProps {
  board: Board;
  onCreateActivity?: () => void;
  onActivityButtonClick?: () => void;
  currentView?: 'personal' | 'class';
  onViewChange?: (mode: 'personal' | 'class') => void;
}

// Helper function to safely get a student ID
function getStudentId(student: any): string {
  if (!student) return `student-${Math.random().toString(36).substring(2, 9)}`;
  
  // Handle both id and _id
  if (student.id) return typeof student.id === 'string' ? student.id : String(student.id);
  if (student._id) return typeof student._id === 'string' ? student._id : String(student._id);
  
  // Last resort fallback
  return `student-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper function to safely convert classId to string
function getClassIdString(classId: any): string {
  if (!classId) return '';
  
  if (typeof classId === 'string') return classId;
  
  if (typeof classId === 'object' && classId !== null) {
    // If it's a MongoDB document with _id
    if ('_id' in classId) return classId._id;
    
    // If it has a toString method that's not the default object toString
    if (typeof classId.toString === 'function' && 
        classId.toString !== Object.prototype.toString) {
      return classId.toString();
    }
  }
  
  // Fallback
  return String(classId);
}

export function BoardHeader({ 
  board, 
  onCreateActivity, 
  onActivityButtonClick,
  currentView = 'personal', 
  onViewChange
}: BoardHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.name);
  const [user, setUser] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };

    fetchSession();
  }, []);

  // Set focus on input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  // Handle title change
  const handleTitleChange = async () => {
    // Don't save empty title
    if (!boardTitle.trim()) {
      setBoardTitle(board.name);
      setIsEditingTitle(false);
      return;
    }

    // Don't save if title didn't change
    if (boardTitle === board.name) {
      setIsEditingTitle(false);
      return;
    }

    try {
      // TODO: Implement API call to update board title
      // For now, we'll simulate a successful update
      toast.success('Board title updated');
      setIsEditingTitle(false);
    } catch (error) {
      toast.error('Failed to update board title');
      setBoardTitle(board.name); // Revert on error
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

  // Cancel editing on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setBoardTitle(board.name);
      setIsEditingTitle(false);
    } else if (e.key === 'Enter') {
      handleTitleChange();
    }
  };

  // Get view description text
  const getViewDescription = () => {
    if (currentView === 'personal') {
      return "Personal view: Manage your own activities across different columns";
    } else {
      return "Class view: Manage student assignments for class activities";
    }
  };

  return (
    <div className="px-2 sm:px-6 py-2 sm:py-3 border-b mb-2 sm:mb-4 bg-background/90 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto whitespace-nowrap">
        {/* Back button */}
        {board.classId && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 min-w-0 p-0 flex-shrink-0 sm:mr-2"
            asChild
          >
            <Link href={`/dashboard/classes/${getClassIdString(board.classId)}`}>
              <ChevronLeftIcon className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Back to class
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {/* Board title and edit */}
        <div className="flex items-center gap-1 min-w-0">
          {isEditingTitle ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTitleChange();
              }}
              className="flex items-center gap-1 min-w-0"
            >
              <Input
                ref={inputRef}
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleTitleChange}
                onKeyDown={handleKeyDown}
                className="text-base sm:text-xl font-semibold h-7 sm:h-9 w-24 sm:w-[320px] min-w-[120px] sm:min-w-[180px] max-w-[90vw] sm:max-w-[400px] truncate"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate min-w-[120px] sm:min-w-[180px] max-w-[90vw] sm:max-w-[400px]">{board.name}</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => setIsEditingTitle(true)}
              >
                <PencilIcon className="h-4 w-4" />
                <span className="sr-only">Edit title</span>
              </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Edit board title
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
              </div>
        
        {/* Online students (desktop only) */}
          {currentView === 'class' && board.classId && board.students && board.students.length > 0 && (
          <div className="hidden sm:block sm:ml-4">
              <BoardStudents 
                students={board.students.map(student => ({
                  id: getStudentId(student),
                  name: student.name || 'Unknown Student',
                  isOnline: Math.random() > 0.5
                }))} 
                maxVisible={5}
              />
        </div>
        )}
        
        {/* View toggle with tooltip */}
        {onViewChange && (
          <div className="ml-2 sm:ml-4 flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
            <div className="bg-background border rounded-md shadow-sm flex">
          <Button 
                variant={currentView === 'personal' ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "rounded-r-none border-0 h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium",
                        currentView === 'personal' && "bg-primary text-primary-foreground"
                      )}
                onClick={() => onViewChange('personal')}
          >
                      <User className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Personal</span>
          </Button>
                    <Separator orientation="vertical" className="h-5 my-auto" />
          <Button 
                variant={currentView === 'class' ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "rounded-l-none border-0 h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium",
                        currentView === 'class' && "bg-primary text-primary-foreground"
                      )}
                onClick={() => onViewChange('class')}
          >
                      <Users className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Class</span>
          </Button>
            </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  {getViewDescription()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* View info button (mobile only) */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 ml-1 sm:hidden"
                  >
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px]">
                  {getViewDescription()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {/* Spacer for desktop */}
        <div className="flex-1" />
        
        {/* Actions: add, settings, avatar */}
        {onActivityButtonClick && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
          <Button 
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-medium"
            onClick={onActivityButtonClick}
          >
                  <PlusCircleIcon className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden sm:inline">Add Activity</span>
                  <span className="sm:hidden">Add</span>
          </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Create a new activity
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
            <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
              <SettingsIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        
        {user && (
          <div className="hidden sm:block">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
              <AvatarFallback>
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
              {user.image && <AvatarImage src={user.image} alt={user.name || ''} />}
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
} 