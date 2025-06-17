import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { Request } from 'express';
import { TeacherDashboardResponseDto } from './dto/teacher-dashboard.dto';
import type { UserDocument } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

/**
 * Controller for analytics-related endpoints
 */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get analytics data for the teacher dashboard
   * @returns Dashboard data for authenticated teacher
   */
  @Get('teacher-dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  async getTeacherDashboard(@Req() req: RequestWithUser): Promise<TeacherDashboardResponseDto> {
    // Extract the user ID from the request
    const teacherId = req.user.userId;
    
    // Get teacher data for analytics
    return this.analyticsService.getTeacherDashboardData(teacherId);
  }
} 