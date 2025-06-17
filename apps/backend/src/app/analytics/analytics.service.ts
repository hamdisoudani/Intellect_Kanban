import { Injectable } from '@nestjs/common';
import { ClassesService } from '../classes/classes.service';
import { ActivitiesService } from '../activities/activities.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { TagsService } from '../tags/tags.service';
import { UserDocument } from '../users/schemas/user.schema';
import { TeacherDashboardResponseDto } from './dto/teacher-dashboard.dto';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly classesService: ClassesService,
    private readonly activitiesService: ActivitiesService,
    private readonly assignmentsService: AssignmentsService,
    private readonly tagsService: TagsService,
    private readonly usersService: UsersService
  ) {}

  /**
   * Gets comprehensive analytics data for the teacher dashboard
   */
  async getTeacherDashboardData(teacherId: string): Promise<TeacherDashboardResponseDto> {
    // First get the teacher document so we have the full user object
    const teacher = await this.usersService.findOne(teacherId);
    
    // Get the data in parallel for better performance
    const [
      statCards,
      assignmentsByStatusChart,
      activityCreationChart,
      tagUsageChart,
      classPerformanceTable,
    ] = await Promise.all([
      this.getStatCards(teacherId),
      this.getAssignmentsByStatus(teacherId),
      this.getActivityCreationByMonth(teacherId),
      this.getTagUsageData(teacherId),
      this.getClassPerformanceData(teacherId),
    ]);

    return {
      statCards,
      assignmentsByStatusChart,
      activityCreationChart,
      tagUsageChart,
      classPerformanceTable,
    };
  }

  /**
   * Gets data for the stat cards section
   */
  private async getStatCards(teacherId: string) {
    // Find all classes created by this teacher
    const classes = await this.classesService.findClassesByTeacher(teacherId);
    const classIds = classes.map((c) => c._id);
    
    // Count unique students across all classes
    const allStudents = new Set();
    classes.forEach((cls) => {
      cls.joinedUsers.forEach((user) => {
        allStudents.add(user.toString());
      });
    });

    // Count activities by type
    const [personalActivities, metaActivities] = await Promise.all([
      this.activitiesService.countActivitiesByTypeAndTeacher(teacherId, 'personal'),
      this.activitiesService.countActivitiesByTypeAndTeacher(teacherId, 'meta'),
    ]);

    return {
      activeClasses: classes.length,
      totalStudents: allStudents.size,
      personalActivities,
      metaActivities,
    };
  }

  /**
   * Gets assignment counts grouped by status (column)
   */
  private async getAssignmentsByStatus(teacherId: string) {
    // Find all classes created by this teacher
    const classes = await this.classesService.findClassesByTeacher(teacherId);
    const classIds = classes.map((c) => c._id);

    // Get boards for these classes
    const boards = await this.activitiesService.getBoardsByClassIds(classIds);
    const boardIds = boards.map((b) => b._id);
    
    // Get assignments grouped by status
    return this.assignmentsService.getAssignmentCountsByStatus(boardIds);
  }

  /**
   * Gets activity creation data broken down by month
   */
  private async getActivityCreationByMonth(teacherId: string) {
    // Get data for the last 3 months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2); // 3 months including current
    
    return this.activitiesService.getActivityCreationByMonth(teacherId, startDate, endDate);
  }

  /**
   * Gets tag usage data for this teacher's activities
   */
  private async getTagUsageData(teacherId: string) {
    return this.tagsService.getTagUsageForTeacher(teacherId);
  }

  /**
   * Gets performance data for each class
   */
  private async getClassPerformanceData(teacherId: string) {
    const classes = await this.classesService.findClassesByTeacher(teacherId);
    
    const results = await Promise.all(
      classes.map(async (cls) => {
        // Get boards for this class
        const boards = await this.activitiesService.getBoardsByClassId(cls._id);
        const boardIds = boards.map((b) => b._id);
        
        // Get completion percentage and assignment counts
        const completionData = await this.assignmentsService.getCompletionPercentageForBoards(boardIds);
        const totalAssignments = await this.assignmentsService.countTotalAssignmentsByBoardIds(boardIds);
        const completedAssignments = await this.assignmentsService.countCompletedAssignmentsByBoardIds(boardIds);
        
        return {
          className: cls.name,
          studentCount: cls.joinedUsers.length,
          boardCount: boards.length,
          totalAssignments,
          completedAssignments,
          completionPercentage: completionData.percentage,
        };
      }),
    );
    
    return results;
  }
} 