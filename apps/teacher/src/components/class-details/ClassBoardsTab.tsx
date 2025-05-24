"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@intellect-kanban/ui';
import { Board } from '@/utils/types';
import { LayoutDashboardIcon, ArrowRightIcon, CalendarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CreateBoardDialog } from '../boards/CreateBoardDialog';

interface ClassBoardsTabProps {
  boards: Board[];
  classId: string;
}

export function ClassBoardsTab({ boards, classId }: ClassBoardsTabProps) {
  const router = useRouter();
  const [localBoards, setLocalBoards] = useState<Board[]>(boards);
  
  // Navigate to board detail page
  const handleOpenBoard = (boardId: string) => {
    router.push(`/dashboard/board/${boardId}`);
  };

  // Add a new board to the local state without refetching
  const handleBoardCreated = (newBoard: Board) => {
    setLocalBoards(prevBoards => [...prevBoards, newBoard]);
  };

  // Get a simplified date format
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {localBoards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboardIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-medium">No Kanban Boards</h3>
            <p className="mt-2 text-center text-muted-foreground max-w-sm">
              Create your first board to start organizing activities for this class.
              Students will be able to track their progress.
            </p>
            <div className="mt-6">
              <CreateBoardDialog 
                onBoardCreated={handleBoardCreated}
                classId={classId}
                size="lg"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {localBoards.map((board) => (
              <Card 
                key={board._id}
                className="cursor-pointer hover:shadow-md transition-all border border-border/60 hover:border-primary/30"
                onClick={() => handleOpenBoard(board._id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{board.name}</CardTitle>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {board.columns.length} columns
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {board.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {board.columns.map((column, index) => (
                        <Badge 
                          key={column.id}
                          variant="secondary"
                          className="text-xs"
                        >
                          {column.name}
                        </Badge>
                      )).slice(0, 3)}
                      {board.columns.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{board.columns.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="pt-4 mt-2 border-t flex justify-between items-center">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{getFormattedDate(board.createdAt)}</span>
                      </div>
                      
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-8 -mr-2"
                      >
                        Open <ArrowRightIcon className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 