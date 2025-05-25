"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@intellect-kanban/ui';
import { Board } from '@/types';
import { LayoutDashboardIcon, ArrowRightIcon, CalendarIcon, Columns } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface ClassBoardsViewProps {
  boards: Board[];
}

export function ClassBoardsView({ boards }: ClassBoardsViewProps) {
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
      scale: 1.02,
      boxShadow: "0 4px 12px -1px rgba(0, 0, 0, 0.1), 0 2px 6px -1px rgba(0, 0, 0, 0.05)",
      borderColor: "hsl(var(--primary) / 0.3)",
      transition: { duration: 0.2, ease: "easeInOut" }
    }
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  // If there are no boards
  if (boards.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboardIcon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No Boards Available</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              There are no boards available for this class yet. Your teacher may add them soon.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Display the boards grid
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {boards.map((board) => (
        <motion.div
          key={board._id}
          variants={cardVariants}
          whileHover="hover"
          onClick={() => handleOpenBoard(board._id)}
          className="cursor-pointer h-full"
        >
          <Card className="h-full border hover:shadow-sm transition-all">
            <CardHeader className="pb-2 space-y-1.5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Columns className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg line-clamp-1">
                    {board.name}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="whitespace-nowrap">
                  {board.columns.length} {board.columns.length === 1 ? 'column' : 'columns'}
                </Badge>
              </div>
              {board.description && (
                <CardDescription className="line-clamp-2 mt-1">
                  {board.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-4">
                {board.columns.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {board.columns.slice(0, 3).map((column) => (
                      <Badge 
                        key={column.id}
                        variant="secondary"
                        className="text-xs px-2 py-0.5"
                      >
                        {column.name}
                      </Badge>
                    ))}
                    {board.columns.length > 3 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        +{board.columns.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-border/30">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    <span>{getFormattedDate(board.createdAt)}</span>
                  </div>
                  
                  <Button 
                    size="sm"
                    className="h-7 gap-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  >
                    Open <ArrowRightIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
} 