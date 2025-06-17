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

// Analytics types for teacher dashboard
export interface StatusCount {
  status: string;
  count: number;
}

export interface MonthlyActivity {
  month: string;
  personal: number;
  meta: number;
}

export interface TagUsage {
  tagName: string;
  count: number;
}

export interface ClassPerformance {
  className: string;
  studentCount: number;
  boardCount: number;
  totalAssignments: number;
  completedAssignments: number;
  completionPercentage: number;
}

export interface TeacherDashboardAnalytics {
  statCards: {
    activeClasses: number;
    totalStudents: number;
    personalActivities: number;
    metaActivities: number;
  };
  assignmentsByStatusChart: StatusCount[];
  activityCreationChart: MonthlyActivity[];
  tagUsageChart: TagUsage[];
  classPerformanceTable: ClassPerformance[];
} 