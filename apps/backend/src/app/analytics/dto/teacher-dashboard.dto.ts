// Individual DTOs for each section of the dashboard response
export class StatCardsDto {
  activeClasses!: number;
  totalStudents!: number;
  personalActivities!: number;
  metaActivities!: number;
}

export class StatusCountDto {
  status!: string;
  count!: number;
}

export class MonthlyActivityCountDto {
  month!: string;
  personal!: number;
  meta!: number;
}

export class TagUsageDto {
  tagName!: string;
  count!: number;
}

export class ClassPerformanceDto {
  className!: string;
  studentCount!: number;
  completionPercentage!: number;
}

// Main response DTO that combines all sections
export class TeacherDashboardResponseDto {
  statCards!: StatCardsDto;
  assignmentsByStatusChart!: StatusCountDto[];
  activityCreationChart!: MonthlyActivityCountDto[];
  tagUsageChart!: TagUsageDto[];
  classPerformanceTable!: ClassPerformanceDto[];
} 