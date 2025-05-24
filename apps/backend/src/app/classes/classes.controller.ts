import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards,
  Req,
  NotFoundException,
  HttpCode,
  HttpStatus,
  ForbiddenException
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  /**
   * Create a new class (teachers only)
   */
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClassDto: CreateClassDto, @Req() req: RequestWithUser) {
    return this.classesService.create(createClassDto, req.user.userId);
  }

  /**
   * Get all classes (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.classesService.findAll();
  }

  /**
   * Get classes created by the logged-in teacher
   */
  @Get('my-created')
  @Roles(UserRole.TEACHER)
  async findMyCreated(@Req() req: RequestWithUser) {
    return this.classesService.findByCreator(req.user.userId);
  }

  /**
   * Get classes joined by the logged-in student
   */
  @Get('my-joined')
  @Roles(UserRole.STUDENT)
  async findMyJoined(@Req() req: RequestWithUser) {
    return this.classesService.findByJoinedUser(req.user.userId);
  }

  /**
   * Get a specific class by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const classObj = await this.classesService.findOne(id);
    
    // Check if user has access to this class
    // Handle both populated and non-populated createdBy field
    const createdById = typeof classObj.createdBy === 'object' && classObj.createdBy !== null 
      ? (classObj.createdBy as any)._id.toString() 
      : String(classObj.createdBy);
    
    const isCreator = createdById === req.user.userId;
    
    // Handle populated joinedUsers array
    const isJoined = classObj.joinedUsers.some(user => {
      const userId = typeof user === 'object' && user !== null 
        ? (user as any)._id.toString()
        : String(user);
      return userId === req.user.userId;
    });
    
    const isAdmin = req.user.role === UserRole.ADMIN;
    
    if (!isCreator && !isJoined && !isAdmin) {
      throw new NotFoundException('Class not found');
    }
    
    // If the user is a student and not the creator, hide the invitation code
    if (req.user.role === UserRole.STUDENT && !isCreator) {
      // Create a new object without the invitationCode
      const { invitationCode, ...classWithoutCode } = classObj.toObject();
      return classWithoutCode;
    }
    
    return classObj;
  }

  /**
   * Join a class using invitation code (students only)
   */
  @Post('join')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  async join(@Body() joinClassDto: JoinClassDto, @Req() req: RequestWithUser) {
    return this.classesService.joinClass(
      joinClassDto, 
      req.user.userId, 
      req.user.role
    );
  }

  /**
   * Remove a user from a class
   */
  @Delete(':classId/users/:userId')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  async removeUserFromClass(
    @Param('classId') classId: string,
    @Param('userId') userId: string,
    @Req() req: RequestWithUser
  ) {
    // First check if the teacher is the creator of the class
    const classObj = await this.classesService.findOne(classId);
    
    // Handle both populated and non-populated createdBy field
    const createdById = typeof classObj.createdBy === 'object' && classObj.createdBy !== null 
      ? (classObj.createdBy as any)._id.toString() 
      : String(classObj.createdBy);
      
    if (createdById !== req.user.userId) {
      throw new ForbiddenException('Only the teacher who created this class can remove users');
    }
    
    return this.classesService.removeUserFromClass(
      classId,
      userId,
      req.user.userId
    );
  }

  /**
   * Delete a class (teachers can only delete their own classes)
   */
  @Delete(':id')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    // First check if the teacher is the creator of the class
    const classObj = await this.classesService.findOne(id);
    
    // Handle both populated and non-populated createdBy field
    const createdById = typeof classObj.createdBy === 'object' && classObj.createdBy !== null 
      ? (classObj.createdBy as any)._id.toString() 
      : String(classObj.createdBy);
      
    if (createdById !== req.user.userId) {
      throw new ForbiddenException('Only the teacher who created this class can delete it');
    }
    
    await this.classesService.remove(id, req.user.userId);
    return { message: 'Class deleted successfully' };
  }
} 