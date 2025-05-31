/**
 * Interface representing a column transition in an activity's history
 */
export interface ColumnTransition {
  columnId: string;
  enteredAt: string;
}

/**
 * Interface for an activity
 */
export interface Activity {
  _id: string;    // MongoDB id from backend
  title: string;
  description: string;
  boardId: string;
  dueDate?: string;
  status?: string;
  priority?: string;
  columnId?: string;
  type: 'personal' | 'meta';
  assignedStudents: any[];
  isArchived: boolean;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  columnHistory?: ColumnTransition[];
  tags?: any[]; // Should ideally be TagType[] from @/types/tags
  difficultyLevel?: string; // Should ideally be DifficultyLevel from @/types/activities
} 