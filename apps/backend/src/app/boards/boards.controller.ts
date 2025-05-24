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
  HttpStatus
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('boards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  /**
   * Create a new board (teachers only)
   */
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req: RequestWithUser) {
    try {
      return await this.boardsService.create(createBoardDto, req.user.userId);
    } catch (error) {
      // Controller level error handling
      throw error;
    }
  }

  /**
   * Get boards for a specific class - role-based access
   * - Teachers: get boards they created for this class
   * - Students: get boards for classes they've joined
   */
  @Get('class/:classId')
  async findByClass(@Param('classId') classId: string, @Req() req: RequestWithUser) {
    try {
      // This is a unified endpoint that handles different roles
      return await this.boardsService.findByClass(
        classId,
        req.user.userId,
        req.user.role
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get boards created by the logged-in teacher (across all classes)
   */
  @Get('my-created')
  @Roles(UserRole.TEACHER)
  async findMyCreated(@Req() req: RequestWithUser) {
    try {
      return await this.boardsService.findByCreator(req.user.userId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get boards from all classes that the logged-in student has joined
   */
  @Get('my-joined-boards')
  @Roles(UserRole.STUDENT)
  async findMyJoinedBoards(@Req() req: RequestWithUser) {
    try {
      return await this.boardsService.findJoinedBoardsForStudent(req.user.userId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a specific board by ID
   * Now also returns students: [{ id, name }] from the related class for activity assignment UI
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      // Use the optimized method that performs retrieval and access check in one operation
      return await this.boardsService.findOneWithAccessCheck(
        id, 
        req.user.userId, 
        req.user.role
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a board (teachers can only delete their own boards)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    try {
      await this.boardsService.remove(id, req.user.userId, req.user.role);
      return { message: 'Board deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
} 