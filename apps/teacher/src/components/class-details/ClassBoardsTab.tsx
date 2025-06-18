"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  Button,
} from '@intellect-kanban/ui';
import { Board } from '@/utils/types';
import { LayoutDashboardIcon, PlusIcon } from 'lucide-react';
import { CreateBoardDialog } from '../boards/CreateBoardDialog';
import { motion } from 'framer-motion';
import { BoardsTable } from './BoardsTable';

interface ClassBoardsTabProps {
  boards: Board[];
  classId: string;
  isLoading?: boolean;
}

export function ClassBoardsTab({ boards, classId, isLoading = false }: ClassBoardsTabProps) {
  const [boardsList, setBoardsList] = useState<Board[]>(boards);

  // Handler for when a new board is created
  const handleBoardCreated = (newBoard: Board) => {
    setBoardsList(prevBoards => [newBoard, ...prevBoards]);
  };

  return (
    <motion.div
      className="space-y-6 w-full overflow-visible"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Boards Table - Ensure container allows scrolling */}
      <div className="w-full overflow-x-auto">
        <BoardsTable 
          boards={boardsList} 
          isLoading={isLoading}
        />
      </div>
      
      {/* When no boards, show create board button */}
      {!isLoading && boardsList.length === 0 && (
        <div className="flex justify-center mt-4">
          <CreateBoardDialog
            onBoardCreated={handleBoardCreated}
            classId={classId}
            variant="outline"
            size="lg"
          />
        </div>
      )}
    </motion.div>
  );
} 