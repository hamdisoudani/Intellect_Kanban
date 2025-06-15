import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Patch,
  BadRequestException
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /**
   * Create a new activity (teachers only)
   */
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createActivityDto: CreateActivityDto, @Req() req: RequestWithUser) {
    try {
      return await this.activitiesService.create(createActivityDto, req.user.userId);
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Get all activities for a specific board
   */
  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string, @Req() req: RequestWithUser) {
    try {
      return await this.activitiesService.findByBoard(
        boardId,
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Get activities assigned to the logged-in student
   */
  @Get('my-assigned')
  @Roles(UserRole.STUDENT)
  async findMyAssigned(@Req() req: RequestWithUser) {
    try {
      return await this.activitiesService.findByStudent(req.user.userId);
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Get a specific activity by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      return await this.activitiesService.findOne(
        id, 
        req.user.userId, 
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Update an activity
   */
  @Patch(':id')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Req() req: RequestWithUser
  ) {
    try {
      return await this.activitiesService.update(
        id,
        updateActivityDto,
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Update an activity's column
   */
  @Patch(':id/column')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async updateColumn(
    @Param('id') id: string,
    @Body() body: { columnId: string },
    @Req() req: RequestWithUser
  ) {
    if (!body.columnId) {
      throw new BadRequestException('Column ID is required');
    }
    
    try {
      return await this.activitiesService.updateColumn(
        id,
        body.columnId,
        req.user.userId
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Assign activity to students
   */
  @Post(':id/assign')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async assignStudents(
    @Param('id') id: string,
    @Body() body: { studentIds: string[] },
    @Req() req: RequestWithUser
  ) {
    if (!body.studentIds || !Array.isArray(body.studentIds) || body.studentIds.length === 0) {
      throw new BadRequestException('Student IDs must be provided as an array with at least one ID');
    }
    
    try {
      return await this.activitiesService.assignStudents(
        id, 
        body.studentIds, 
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Remove students from an activity
   */
  @Post(':id/unassign')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async removeStudents(
    @Param('id') id: string,
    @Body() body: { studentIds: string[] },
    @Req() req: RequestWithUser
  ) {
    if (!body.studentIds || !Array.isArray(body.studentIds) || body.studentIds.length === 0) {
      throw new BadRequestException('Student IDs must be provided as an array with at least one ID');
    }
    
    try {
      return await this.activitiesService.removeStudents(
        id, 
        body.studentIds,
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Archive an activity
   */
  @Patch(':id/archive')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async archive(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      return await this.activitiesService.archive(
        id, 
        req.user.userId, 
        req.user.role
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Delete an activity (teachers can only delete their own activities)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      await this.activitiesService.remove(
        id, 
        req.user.userId, 
        req.user.role
      );
      return { message: 'Activity deleted successfully' };
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Add tags to an activity
   */
  @Post(':id/tags')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async addTags(
    @Param('id') id: string,
    @Body() body: { tagIds: string[] },
    @Req() req: RequestWithUser
  ) {
    if (!body.tagIds || !Array.isArray(body.tagIds) || body.tagIds.length === 0) {
      throw new BadRequestException('Tag IDs must be provided as an array with at least one ID');
    }
    
    try {
      return await this.activitiesService.addTags(
        id, 
        body.tagIds,
        req.user.userId
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Remove tags from an activity
   */
  @Delete(':id/tags')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async removeTags(
    @Param('id') id: string,
    @Body() body: { tagIds: string[] },
    @Req() req: RequestWithUser
  ) {
    if (!body.tagIds || !Array.isArray(body.tagIds) || body.tagIds.length === 0) {
      throw new BadRequestException('Tag IDs must be provided as an array with at least one ID');
    }
    
    try {
      return await this.activitiesService.removeTags(
        id, 
        body.tagIds,
        req.user.userId
      );
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }
} 