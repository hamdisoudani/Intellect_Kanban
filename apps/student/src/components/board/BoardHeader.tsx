"use client";

import { useEffect, useState } from 'react';
import { Board } from '@/types';
import { 
  ChevronLeftIcon
} from 'lucide-react';
import { 
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@intellect-kanban/ui';
import Link from 'next/link';
import { getSession, logout } from '@/server/auth-actions';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const [user, setUser] = useState<any>(null);

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

  // Helper function to safely convert classId to string
  function getClassIdString(classId: any): string {
    if (!classId) return '';
    
    if (typeof classId === 'string') return classId;
    
    if (typeof classId === 'object' && classId !== null) {
      if ('_id' in classId) return classId._id;
      
      if (typeof classId.toString === 'function' && 
          classId.toString !== Object.prototype.toString) {
        return classId.toString();
      }
    }
    
    return String(classId);
  }

  // Handle sign out
  const handleSignOut = async () => {
    await logout();
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b mb-2">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{board.name}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Back to class button */}
        {board.classId && (
          <Button
            variant="outline" 
            size="sm"
            className="h-8 text-xs px-3"
            asChild
          >
            <Link href={`/dashboard/classes/${getClassIdString(board.classId)}`}>
              <ChevronLeftIcon className="mr-1.5 h-3.5 w-3.5" />
              Back to class
            </Link>
          </Button>
        )}

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
} 