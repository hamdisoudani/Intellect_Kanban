import { User } from './classes';

/**
 * Student option for activity assignment
 */
export interface StudentOption {
  id: string;
  name: string;
}

/**
 * Interface for a Kanban board column
 */
export interface Column {
  id: string;
  name: string;
  order: number;
}

/**
 * Interface for Board data received from backend
 */
export interface Board {
  _id: string;
  name: string;
  description?: string;
  classId: string;
  columns: Column[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  students?: StudentOption[]; // Students in the class, for activity assignment
}

/**
 * Interface for API response when fetching boards
 */
export type BoardsResponse = Board[]; 