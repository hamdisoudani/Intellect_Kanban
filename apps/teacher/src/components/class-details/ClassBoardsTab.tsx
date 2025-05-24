"use client";

import { useEffect } from 'react';
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
import { LayoutDashboardIcon, ArrowRightIcon, CalendarIcon, Columns } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CreateBoardDialog } from '../boards/CreateBoardDialog';
import { motion } from 'framer-motion';

interface ClassBoardsTabProps {
  boards: Board[];
  classId: string;
}

export function ClassBoardsTab({ boards, classId }: ClassBoardsTabProps) {
  const router = useRouter();
  
  // Navigate to board detail page
  const handleOpenBoard = (boardId: string) => {
    router.push(`/dashboard/board/${boardId}`);
  };

  // Get a simplified date format
  const getFormattedDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Unknown date';
    }
  };

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.25 }
    },
    hover: { 
      scale: 1.01,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      borderColor: "hsl(var(--primary) / 0.2)",
      transition: { duration: 0.15, ease: "easeInOut" }
    }
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  return (
    <div>
      {boards.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
              <LayoutDashboardIcon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-medium">No Kanban Boards</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Create your first board to start organizing activities for this class.
            </p>
            <div className="mt-4">
              <CreateBoardDialog 
                onBoardCreated={(newBoard) => {
                  // This will be handled by the parent component
                  console.log("Board created in empty state view");
                }}
                classId={classId}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {boards.map((board) => (
            <motion.div
              key={board._id}
              variants={cardVariants}
              whileHover="hover"
              onClick={() => handleOpenBoard(board._id)}
              className="cursor-pointer"
            >
              <Card className="h-full border hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2 space-y-1">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base sm:text-lg line-clamp-1 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Columns className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {board.name}
                    </CardTitle>
                    <Badge variant="outline" className="whitespace-nowrap text-xs">
                      {board.columns.length} {board.columns.length === 1 ? 'column' : 'columns'}
                    </Badge>
                  </div>
                  {board.description && (
                    <CardDescription className="line-clamp-1 text-xs sm:text-sm">
                      {board.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    {board.columns.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {board.columns.slice(0, 3).map((column) => (
                          <Badge 
                            key={column.id}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                          >
                            {column.name}
                          </Badge>
                        ))}
                        {board.columns.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            +{board.columns.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-border/30">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>{getFormattedDate(board.createdAt)}</span>
                      </div>
                      
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                      >
                        Open <ArrowRightIcon className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
} 