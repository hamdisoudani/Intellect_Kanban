// User types
export interface User {
  _id: string;
  name: string;
  email?: string;
}

// Class types
export interface Class {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
  };
  joinedUsers: User[];
}

// Board types
export interface Column {
  id: string;
  name: string;
  order: number;
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  classId: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

// Assignment types
export interface Assignment {
  _id: string;
  activityId: string;
  studentId: string;
  boardId: string;
  columnId: string;
  position: number;
  notes?: string;
  columnHistory: {
    columnId: string;
    enteredAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Feedback type
export interface Feedback {
  _id?: string;
  content: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  readByStudent: boolean;
}

// Activity types
export interface Activity {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  type: 'personal' | 'meta';
  dueDate?: string;
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
}

// Tag types
export interface Tag {
  _id: string;
  name: string;
  description?: string;
  color: string;
}

// For frontend compatibility (our components use label instead of name)
export interface FrontendTag {
  id: string;
  label: string;
  color: string;
}

// Priority levels
export type PriorityLevel = 'low' | 'medium' | 'high';

// Attachment type
export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

// Extended assignment with metadata from parent activity
export interface AssignmentWithMeta {
  _id: string;
  activityId: string;
  studentId: string;
  boardId: string;
  columnId: string;
  position: number;
  notes?: string;
  
  // Metadata from parent activity
  title: string;
  description?: string;
  dueDate?: string;
  difficultyLevel?: string;
  estimatedTimeMinutes?: number;
  tags?: FrontendTag[];
  priority?: PriorityLevel;
  attachments?: Attachment[];
  
  // Feedback from teachers
  feedback?: Feedback[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
} 