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
  AvatarFallback
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
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getSession, logout } from '@/server/auth-actions';
import { BoardStudents } from './BoardStudents';

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

  return (
    <div className="px-2 sm:px-8 py-1.5 sm:py-4 border-b mb-2 sm:mb-4 bg-background">
      <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto whitespace-nowrap">
        {/* Back button */}
        {board.classId && (
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
                className="text-base sm:text-2xl font-semibold h-7 sm:h-10 w-24 sm:w-[320px] min-w-[120px] sm:min-w-[180px] max-w-[90vw] sm:max-w-[400px] truncate"
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
              <h1 className="text-base sm:text-2xl font-semibold truncate min-w-[120px] sm:min-w-[180px] max-w-[90vw] sm:max-w-[400px]">{board.name}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => setIsEditingTitle(true)}
              >
                <PencilIcon className="h-4 w-4" />
                <span className="sr-only">Edit title</span>
              </Button>
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
        {/* View toggle */}
        {onViewChange && (
          <div className="ml-2 sm:ml-4">
            <div className="bg-background border rounded-md shadow-sm flex">
          <Button 
                variant={currentView === 'personal' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-r-none border-0 h-7 w-7 sm:h-9 sm:w-20 text-xs font-medium"
                onClick={() => onViewChange('personal')}
          >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Personal</span>
          </Button>
          <Button 
                variant={currentView === 'class' ? 'default' : 'ghost'}
                size="icon"
                className="rounded-l-none border-0 border-l h-7 w-7 sm:h-9 sm:w-20 text-xs font-medium"
                onClick={() => onViewChange('class')}
          >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Class</span>
          </Button>
            </div>
          </div>
        )}
        {/* Spacer for desktop */}
        <div className="flex-1" />
        {/* Actions: add, settings, avatar */}
        {onActivityButtonClick && (
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            onClick={onActivityButtonClick}
          >
            <PlusCircleIcon className="h-4 w-4" />
            <span className="sr-only">Add Activity</span>
          </Button>
        )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
              <SettingsIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
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