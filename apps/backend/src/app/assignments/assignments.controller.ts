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
  ForbiddenException,
  Patch
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  /**
   * Create assignments for multiple students for an activity (teachers only)
   */
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAssignmentDto: CreateAssignmentDto, 
    @Body('boardId') boardId: string
  ) {
    return this.assignmentsService.createBatch(createAssignmentDto, boardId);
  }

  /**
   * Get all assignments for a specific activity
   */
  @Get('activity/:activityId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async findByActivity(@Param('activityId') activityId: string) {
    return this.assignmentsService.findByActivity(activityId);
  }

  /**
   * Get assignments for the logged-in student
   */
  @Get('my')
  @Roles(UserRole.STUDENT)
  async findMy(@Req() req: RequestWithUser) {
    return this.assignmentsService.findByStudent(req.user.userId);
  }

  /**
   * Get assignments for a specific board and student
   */
  @Get('board/:boardId/student/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async findByBoardAndStudent(
    @Param('boardId') boardId: string,
    @Param('studentId') studentId: string
  ) {
    return this.assignmentsService.findByBoardAndStudent(boardId, studentId);
  }

  /**
   * Get assignments for a board (teachers only)
   */
  @Get('board/:boardId')
  async findByBoard(@Param('boardId') boardId: string) {
    return this.assignmentsService.findByBoard(boardId);
  }

  /**
   * Get a specific assignment
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const assignment = await this.assignmentsService.findOne(id);
    
    // Students can only view their own assignments
    if (req.user.role === UserRole.STUDENT && assignment.studentId.toString() !== req.user.userId) {
      throw new ForbiddenException('You can only view your own assignments');
    }
    
    return assignment;
  }

  /**
   * Update an assignment (move to a different column)
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
    @Req() req: RequestWithUser
  ) {
    return this.assignmentsService.update(
      id, 
      updateAssignmentDto, 
      req.user.userId, 
      req.user.role
    );
  }

  /**
   * Add feedback to an assignment (teachers only)
   */
  @Post(':id/feedback')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async addFeedback(
    @Param('id') id: string,
    @Body() body: { content: string },
    @Req() req: RequestWithUser
  ) {
    return this.assignmentsService.addFeedback(id, body.content, req.user.userId);
  }

  /**
   * Mark feedback as read (students only)
   */
  @Patch(':id/feedback/read')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  async markFeedbackAsRead(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ) {
    return this.assignmentsService.markFeedbackAsRead(id, req.user.userId);
  }

  /**
   * Delete an assignment
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.assignmentsService.remove(id, req.user.userId, req.user.role);
    return { message: 'Assignment deleted successfully' };
  }
} 