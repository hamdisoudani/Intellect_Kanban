"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback
} from '@intellect-kanban/ui';
import { Board } from '@/utils/types';
import { 
  MoreHorizontalIcon, 
  PenIcon, 
  SettingsIcon, 
  ChevronLeftIcon, 
  PlusCircleIcon,
  ColumnsIcon,
  UsersIcon,
  PencilIcon,
  CheckIcon,
  Link2Icon,
  ShareIcon,
  TrashIcon,
  User,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getSession, logout } from '@/server/auth-actions';

interface BoardHeaderProps {
  board: Board;
  onCreateActivity?: () => void;
  onActivityButtonClick?: () => void;
  currentView?: 'personal' | 'class';
  onViewChange?: (mode: 'personal' | 'class') => void;
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
  const [boardDescription, setBoardDescription] = useState(board.description || '');
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
    <div className="px-4 py-3 border-b mb-4 bg-background">
      {/* Board header with flexible layout */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditingTitle ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTitleChange();
              }}
              className="flex items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleTitleChange}
                onKeyDown={handleKeyDown}
                className="text-xl font-semibold h-9 w-full max-w-xs"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="h-9 px-2"
              >
                <CheckIcon className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{board.name}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsEditingTitle(true)}
              >
                <PencilIcon className="h-3.5 w-3.5" />
                <span className="sr-only">Edit title</span>
              </Button>
            </div>
          )}

          {/* View toggle */}
          {onViewChange && (
            <div className="bg-background border rounded-md shadow-sm">
              <div className="flex">
                <Button
                  variant={currentView === 'personal' ? 'default' : 'ghost'} 
                  size="sm"
                  className="rounded-r-none border-0 text-xs px-3 h-8 font-medium"
                  onClick={() => onViewChange('personal')}
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  <span>Personal</span>
                </Button>
                <Button
                  variant={currentView === 'class' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none border-0 border-l text-xs px-3 h-8 font-medium"
                  onClick={() => onViewChange('class')}
                >
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  <span>Class</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Back to class button - moved to the action buttons area */}
          {board.classId && (
            <Button
              variant="outline" 
              size="sm"
              className="h-8 text-xs"
              asChild
            >
              <a href={`/dashboard/classes/${getClassIdString(board.classId)}`}>
                <ChevronLeftIcon className="mr-1.5 h-3.5 w-3.5" />
                Back to class
              </a>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              if (onActivityButtonClick) {
                onActivityButtonClick();
              } else if (onCreateActivity) {
                onCreateActivity();
              } else {
                toast.info('Create activity functionality coming soon');
              }
            }}
          >
            <PlusCircleIcon className="mr-1.5 h-3.5 w-3.5" />
            Create Activity
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex h-8 text-xs"
            onClick={() => toast.info('Share functionality coming soon')}
          >
            <ShareIcon className="mr-1.5 h-3.5 w-3.5" />
            Share
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => toast.info('Settings functionality coming soon')}
          >
            <SettingsIcon className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={() => toast.info('Delete functionality coming soon')}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Delete board</span>
          </Button>

          {/* User Profile Dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full p-0 ml-2">
                  <Avatar className="h-8 w-8">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name || 'User'} />
                    ) : (
                      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && <p className="font-medium">{user.name}</p>}
                    {user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
} 