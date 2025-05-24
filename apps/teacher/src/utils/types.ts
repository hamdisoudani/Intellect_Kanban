// User types
export interface StudentOption {
  _id: string;
  name: string;
  email?: string;
}

// Board types
export interface Column {
  id: string;
  name: string;
  order: number;
  boardId: string;
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  classId?: string;
  className?: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
  students?: StudentOption[];
}

// Activity types
export interface Activity {
  _id: string;
  id?: string;
  title: string;
  description?: string;
  boardId: string;
  columnId?: string;
  priority: 'Low' | 'Medium' | 'High';
  type: 'personal' | 'meta';
  dueDate?: string;
  assignedStudents?: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
  };
}

// Class types
export interface Class {
  _id: string;
  name: string;
  description?: string;
  invitationCode: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    _id: string;
    name: string;
  };
  joinedUsers: StudentOption[];
} 