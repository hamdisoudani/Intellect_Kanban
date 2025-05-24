import { User } from './classes';

export interface ColumnTransition {
  columnId: string;
  enteredAt: string;
  _id?: string;
}

export interface FeedbackEntry {
  _id?: string;
  content: string;
  createdBy: string | User;
  createdAt: string;
  readByStudent: boolean;
}

export interface ActivityRef {
  _id: string;
  title: string;
}

export interface Assignment {
  _id: string;
  activityId: string | ActivityRef;
  studentId: string | User;
  boardId: string;
  columnId: string;
  position: number;
  notes?: string;
  columnHistory: ColumnTransition[];
  feedback: FeedbackEntry[];
  createdAt?: string;
  updatedAt?: string;
} 