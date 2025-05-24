/**
 * Difficulty levels for activities
 */
export enum DifficultyLevel {
  FOUNDATIONAL = 'foundational',
  DEVELOPING = 'developing',
  PROFICIENT = 'proficient',
  ADVANCED = 'advanced',
  MASTERY = 'mastery'
}

/**
 * Activity interface
 */
export interface Activity {
  _id: string;
  title: string;
  description?: string;
  boardId: string;
  dueDate?: string;
  createdBy: {
    _id: string;
    name: string;
  };
  type: 'personal' | 'meta';
  assignedStudents?: Array<{
    _id: string;
    name: string;
  }>;
  columnId?: string;
  columnHistory?: Array<{
    columnId: string;
    enteredAt: string;
    _id: string;
  }>;
  isArchived: boolean;
  tags: Array<{
    _id: string;
    name: string;
    color: string;
  }>;
  difficultyLevel?: DifficultyLevel;
  estimatedTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Data for creating a new activity
 */
export interface CreateActivityDto {
  title: string;
  description?: string;
  boardId: string;
  dueDate?: string;
  type: 'personal' | 'meta';
  columnId?: string;
  assignedStudents?: string[];
  tags?: string[];
  difficultyLevel?: DifficultyLevel;
  estimatedTimeMinutes?: number;
}

/**
 * Readable labels for difficulty levels
 */
export const difficultyLevelLabels: Record<DifficultyLevel, string> = {
  [DifficultyLevel.FOUNDATIONAL]: 'Foundational',
  [DifficultyLevel.DEVELOPING]: 'Developing',
  [DifficultyLevel.PROFICIENT]: 'Proficient',
  [DifficultyLevel.ADVANCED]: 'Advanced',
  [DifficultyLevel.MASTERY]: 'Mastery'
};

/**
 * Colors for difficulty levels
 */
export const difficultyLevelColors: Record<DifficultyLevel, string> = {
  [DifficultyLevel.FOUNDATIONAL]: '#10B981', // Green
  [DifficultyLevel.DEVELOPING]: '#3B82F6', // Blue
  [DifficultyLevel.PROFICIENT]: '#F59E0B', // Amber
  [DifficultyLevel.ADVANCED]: '#F97316', // Orange
  [DifficultyLevel.MASTERY]: '#EF4444'  // Red
}; 