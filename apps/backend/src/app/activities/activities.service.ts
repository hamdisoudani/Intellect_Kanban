import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UserRole } from '../users/schemas/user.schema';
import { Board } from '../boards/schemas/board.schema';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { TagsService } from '../tags/tags.service';
import { TagDocument } from '../tags/schemas/tag.schema';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Board.name) private boardModel: Model<Board>,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly assignmentsService: AssignmentsService,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * Validate tags for an activity
   * - Ensure tags exist and belong to the teacher
   * - Ensure activity has maximum 5 tags
   * - Ensure no duplicates
   */
  async validateTags(tagIds: string[], userId: string): Promise<Types.ObjectId[]> {
    if (!tagIds || tagIds.length === 0) {
      return [];
    }

    // Check maximum tags limit
    if (tagIds.length > 5) {
      throw new BadRequestException('Activities can have a maximum of 5 tags');
    }

    // Remove duplicates
    const uniqueTagIds = [...new Set(tagIds)];
    
    // Validate each tag
    const validatedTags: Types.ObjectId[] = [];
    for (const tagId of uniqueTagIds) {
      try {
        const tag = await this.tagsService.findOne(tagId);
        
        // Check if the tag belongs to the user
        if (tag.createdBy.toString() !== userId) {
          throw new BadRequestException(`Tag with ID ${tagId} does not belong to you`);
        }
        
        validatedTags.push(new Types.ObjectId(tagId));
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException(`Tag with ID ${tagId} does not exist`);
        }
        throw error;
      }
    }
    
    return validatedTags;
  }

  /**
   * Create a new activity
   */
  async create(createActivityDto: CreateActivityDto, userId: string): Promise<ActivityDocument> {
    try {
      // Validate board exists
      const board = await this.boardModel.findById(createActivityDto.boardId).exec();
      if (!board) {
        throw new NotFoundException(`Board with ID ${createActivityDto.boardId} not found`);
      }
      // Check if user has permission to create activities for this board
      const createdById = typeof board.createdBy === 'object' && board.createdBy !== null 
        ? (board.createdBy as any)._id.toString() 
        : String(board.createdBy);
      if (createdById !== userId) {
        throw new ForbiddenException('You can only create activities for boards you have created');
      }
      // Check due date is in the future (redundant, but for safety)
      if (createActivityDto.dueDate) {
        const dueDate = new Date(createActivityDto.dueDate);
        if (dueDate <= new Date()) {
          throw new BadRequestException('Due date must be in the future.');
        }
      }

      // Validate tags if provided
      const validatedTags = await this.validateTags(createActivityDto.tags || [], userId);
      
      // Handle personal and meta types
      if (createActivityDto.type === 'personal') {
        if (createActivityDto.assignedStudents && createActivityDto.assignedStudents.length > 0) {
          throw new BadRequestException('Personal activities cannot have assigned students.');
        }
        
        // Ensure personal activities have a columnId
        if (!createActivityDto.columnId) {
          throw new BadRequestException('Personal activities require a column ID.');
        }
        
        // Initialize column history for personal activities
        const columnHistory = [
          { columnId: createActivityDto.columnId, enteredAt: new Date() }
        ];
        
        // Create activity with initial column history
        const newActivity = new this.activityModel({
          ...createActivityDto,
          columnHistory,
          createdBy: new Types.ObjectId(userId),
          assignedStudents: [],
          tags: validatedTags,
        });
        const savedActivity = await newActivity.save();
        
        // Populate the tag information before returning
        const populatedActivity = await this.activityModel.findById(savedActivity._id)
          .populate('createdBy', 'name _id')
          .populate('tags', '_id name color')
          .exec();

        if (!populatedActivity) {
          return savedActivity; // Fallback to unpopulated activity if population fails
        }

        return populatedActivity;
      }
      if (createActivityDto.type === 'meta') {
        // assignedStudents can be empty or undefined
        let validStudentIds: Types.ObjectId[] = [];
        if (createActivityDto.assignedStudents && createActivityDto.assignedStudents.length > 0) {
          // Get the classId from the board
          const classId = typeof board.classId === 'object' && board.classId !== null
            ? (board.classId as any)._id.toString()
            : String(board.classId);
          const classObj = await this.classesService.findOne(classId);
          // Validate each student
          for (const studentId of createActivityDto.assignedStudents) {
            // Check user exists
            const user = await this.usersService.findOne(studentId);
            if (!user) {
              throw new BadRequestException(`Assigned student with ID ${studentId} does not exist.`);
            }
            // Check user is a student
            if (user.role !== UserRole.STUDENT) {
              throw new BadRequestException(`User ${user.name} is not a student.`);
            }
            // Check user is a member of the class
            const isMember = classObj.joinedUsers.some(
              (u: any) => (typeof u === 'object' && u !== null ? u._id.toString() : u.toString()) === studentId
            );
            if (!isMember) {
              throw new BadRequestException(`Student ${user.name} is not a member of the class.`);
            }
            validStudentIds.push(new Types.ObjectId(studentId));
          }
        }
        // Create the activity
        const newActivity = new this.activityModel({
          ...createActivityDto,
          createdBy: new Types.ObjectId(userId),
          assignedStudents: validStudentIds,
          tags: validatedTags,
        });
        const savedActivity = await newActivity.save();
        
        // Create assignments for each student if any
        if (validStudentIds.length > 0) {
          await this.assignmentsService.createBatch({
            activityId: (savedActivity._id as Types.ObjectId).toString(),
            studentIds: validStudentIds.map(id => id.toString()),
          }, board._id.toString());
        }
        
        // Populate the tag information before returning
        const populatedActivity = await this.activityModel.findById(savedActivity._id)
          .populate('createdBy', 'name _id')
          .populate('assignedStudents', 'name _id')
          .populate('tags', '_id name color')
          .exec();

        if (!populatedActivity) {
          return savedActivity; // Fallback to unpopulated activity if population fails
        }

        return populatedActivity;
      }
      throw new BadRequestException('Invalid activity type.');
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid activity data: ' + error.message);
      }
      // Handle duplicate key error
      if (error.code === 11000) {
        throw new BadRequestException('An activity with this title already exists for this board');
      }
      // Handle other errors
      throw new BadRequestException('Failed to create activity: ' + error.message);
    }
  }

  /**
   * Find all activities for a board
   */
  async findByBoard(boardId: string, userId: string, userRole: string): Promise<ActivityDocument[]> {
    try {
      // Validate board exists
      const board = await this.boardModel.findById(boardId).exec();
      if (!board) {
        throw new NotFoundException(`Board with ID ${boardId} not found`);
      }
      
      // Check if user has permission to view activities for this board
      // Handle both populated and non-populated createdBy field
      const createdById = typeof board.createdBy === 'object' && board.createdBy !== null 
        ? (board.createdBy as any)._id.toString() 
        : String(board.createdBy);
        
      const isCreator = createdById === userId;
      const isAdmin = userRole === UserRole.ADMIN;
      
      // If not creator or admin, need to check if student is allowed to view this board
      if (!isCreator && !isAdmin && userRole === UserRole.STUDENT) {
        // Need to check if student is a member of the class this board belongs to
        // For simplicity, we're assuming this will be handled at the controller level
        // or by the checkBoardAccess method in the BoardsService
      }
      
      return this.activityModel.find({ 
        boardId: new Types.ObjectId(boardId),
        isArchived: false 
      })
        .populate('createdBy', 'name _id')
        .populate('assignedStudents', 'name _id')
        .populate('tags', '_id name color') // Only populate required tag fields
        .exec();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to find activities: ' + error.message);
    }
  }

  /**
   * Find an activity by ID
   */
  async findOne(id: string, userId?: string, userRole?: string): Promise<ActivityDocument> {
    try {
      const activity = await this.activityModel.findById(id)
        .populate('createdBy', 'name _id')
        .populate('assignedStudents', 'name _id')
        .populate('tags', '_id name color') // Only populate required tag fields
        .exec();
        
      if (!activity) {
        throw new NotFoundException(`Activity with ID ${id} not found`);
      }
      
      // If userId and userRole provided, check permissions
      if (userId && userRole) {
        // Handle both populated and non-populated createdBy field
        const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
          ? (activity.createdBy as any)._id.toString() 
          : String(activity.createdBy);
          
        // Admins and activity creators always have access
        const isCreator = createdById === userId;
        const isAdmin = userRole === UserRole.ADMIN;
        
        // Students only have access if they are assigned to the activity
        const isAssigned = userRole === UserRole.STUDENT && 
          activity.assignedStudents.some(student => {
            // Handle populated student objects too
            const studentId = typeof student === 'object' && student !== null
              ? (student as any)._id.toString()
              : String(student);
            return studentId === userId;
          });
        
        if (!isAdmin && !isCreator && !isAssigned) {
          throw new ForbiddenException('You do not have permission to view this activity');
        }
      }
      
      return activity;
    } catch (error: any) {
      // If error is MongoDB cast error (invalid ID format)
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid activity ID format');
      }
      
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to find activity: ' + error.message);
    }
  }

  /**
   * Add students to an activity
   */
  async assignStudents(activityId: string, studentIds: string[], userId: string, userRole: string): Promise<ActivityDocument> {
    try {
      // Get the activity first to check permissions
      const activity = await this.findOne(activityId);
      
      // Check if user has permission to assign students
      // Handle both populated and non-populated createdBy field
      const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
        ? (activity.createdBy as any)._id.toString() 
        : String(activity.createdBy);
        
      const isCreator = createdById === userId;
      const isAdmin = userRole === UserRole.ADMIN;
      
      if (!isCreator && !isAdmin) {
        throw new ForbiddenException('You can only assign students to activities you have created');
      }
      
      // Ensure activity is of type 'meta'
      if (activity.type !== 'meta') {
        throw new BadRequestException('Only meta activities can have assigned students');
      }
      
      // Get the board to access class information
      const board = await this.boardModel.findById(activity.boardId).exec();
      if (!board) {
        throw new NotFoundException(`Board with ID ${activity.boardId} not found`);
      }
      
      // Get the classId from the board
      const classId = typeof board.classId === 'object' && board.classId !== null
        ? (board.classId as any)._id.toString()
        : String(board.classId);
      
      // Get class details to check membership
      const classObj = await this.classesService.findOne(classId);
      
      // Track which students are already assigned vs newly added
      const currentStudentIds = activity.assignedStudents.map(student => 
        typeof student === 'object' && student !== null ? (student as any)._id.toString() : String(student)
      );
      
      const newStudentIds: string[] = [];
      const validStudentIds: string[] = [...currentStudentIds];
      
      // Validate each student
      for (const studentId of studentIds) {
        // Skip if already in the valid list (already processed or currently assigned)
        if (validStudentIds.includes(studentId)) {
          continue;
        }
        
        // Check user exists
        const user = await this.usersService.findOne(studentId);
        if (!user) {
          throw new BadRequestException(`Student with ID ${studentId} does not exist`);
        }
        
        // Check user is a student
        if (user.role !== UserRole.STUDENT) {
          throw new BadRequestException(`User ${user.name} is not a student`);
        }
        
        // Check user is a member of the class
        const isMember = classObj.joinedUsers.some(
          (u: any) => (typeof u === 'object' && u !== null ? u._id.toString() : String(u)) === studentId
        );
        
        if (!isMember) {
          throw new BadRequestException(`Student ${user.name} is not a member of the class`);
        }
        
        // Add to valid and new student lists
        validStudentIds.push(studentId);
        newStudentIds.push(studentId);
      }
      
      // Create assignments for newly added students
      if (newStudentIds.length > 0) {
        await this.assignmentsService.createBatch({
          activityId: (activity._id as any).toString(),
          studentIds: newStudentIds,
        }, (board._id as any).toString());
      }
      
      // Convert student IDs to ObjectIds
      const studentObjectIds = validStudentIds.map(id => new Types.ObjectId(id));
      
      // Use findByIdAndUpdate to avoid version conflicts
      const updatedActivity = await this.activityModel.findByIdAndUpdate(
        activityId,
        { assignedStudents: studentObjectIds },
        { new: true } // Return the updated document
      )
      .populate('createdBy', 'name _id')
      .populate('assignedStudents', 'name _id')
      .exec();
      
      if (!updatedActivity) {
        throw new NotFoundException(`Activity with ID ${activityId} not found after update`);
      }
      
      return updatedActivity;
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      
      throw new BadRequestException('Failed to assign students: ' + error.message);
    }
  }

  /**
   * Remove students from an activity
   */
  async removeStudents(activityId: string, studentIds: string[], userId: string, userRole: string): Promise<ActivityDocument> {
    try {
      // Get the activity first to check permissions
      const activity = await this.findOne(activityId);
      
      // Check if user has permission to remove students
      // Handle both populated and non-populated createdBy field
      const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
        ? (activity.createdBy as any)._id.toString() 
        : String(activity.createdBy);
        
      const isCreator = createdById === userId;
      const isAdmin = userRole === UserRole.ADMIN;
      
      if (!isCreator && !isAdmin) {
        throw new ForbiddenException('You can only remove students from activities you have created');
      }
      
      // Get current student IDs and filter out the ones to remove
      const currentStudentIds = activity.assignedStudents.map(student => 
        typeof student === 'object' && student !== null ? (student as any)._id.toString() : String(student)
      );
      
      const updatedStudentIds = currentStudentIds.filter(id => !studentIds.includes(id));
      
      // Convert to ObjectIds
      const studentObjectIds = updatedStudentIds.map(id => new Types.ObjectId(id));
      
      // Use findByIdAndUpdate to avoid version conflicts
      const updatedActivity = await this.activityModel.findByIdAndUpdate(
        activityId,
        { assignedStudents: studentObjectIds },
        { new: true } // Return the updated document
      )
      .populate('createdBy', 'name _id')
      .populate('assignedStudents', 'name _id')
      .exec();
      
      if (!updatedActivity) {
        throw new NotFoundException(`Activity with ID ${activityId} not found after update`);
      }
      
      return updatedActivity;
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to remove students: ' + error.message);
    }
  }

  /**
   * Get activities assigned to a specific student
   */
  async findByStudent(studentId: string): Promise<ActivityDocument[]> {
    try {
      return this.activityModel.find({ 
        assignedStudents: new Types.ObjectId(studentId),
        isArchived: false 
      })
        .populate('createdBy', 'name _id')
        .populate('assignedStudents', 'name _id')
        .exec();
    } catch (error: any) {
      throw new BadRequestException('Failed to find activities: ' + error.message);
    }
  }

  /**
   * Archive an activity
   */
  async archive(id: string, userId: string, userRole: string): Promise<ActivityDocument> {
    try {
      const activity = await this.findOne(id);
      
      // Handle both populated and non-populated createdBy field
      const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
        ? (activity.createdBy as any)._id.toString() 
        : String(activity.createdBy);
      
      // Only admins or the creator can archive
      if (userRole !== UserRole.ADMIN && createdById !== userId) {
        throw new ForbiddenException('You do not have permission to archive this activity');
      }
      
      activity.isArchived = true;
      return await activity.save();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to archive activity: ' + error.message);
    }
  }

  /**
   * Delete an activity
   */
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    try {
      const activity = await this.findOne(id);
      
      // Handle both populated and non-populated createdBy field
      const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
        ? (activity.createdBy as any)._id.toString() 
        : String(activity.createdBy);
      
      // Check if user has permission (admin or creator)
      if (userRole !== UserRole.ADMIN && createdById !== userId) {
        throw new ForbiddenException('You do not have permission to delete this activity');
      }
      
      await this.activityModel.findByIdAndDelete(id).exec();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to delete activity: ' + error.message);
    }
  }

  /**
   * Update an activity's column - only for personal activities
   */
  async updateColumn(activityId: string, columnId: string, userId: string): Promise<ActivityDocument> {
    try {
      // Get the activity to check permissions and type
      const activity = await this.findOne(activityId);
      
      // Check if user has permission to update this activity
      // Handle both populated and non-populated createdBy field
      const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
        ? (activity.createdBy as any)._id.toString() 
        : String(activity.createdBy);
        
      if (createdById !== userId) {
        throw new ForbiddenException('You can only update columns for activities you have created');
      }
      
      // Only allow updating column for personal activities
      if (activity.type !== 'personal') {
        throw new BadRequestException('Only personal activities can be moved between columns');
      }
      
      // Track column transition in history
      const now = new Date();
      const newColumnTransition = { columnId, enteredAt: now };
      
      // Initialize column history if it doesn't exist
      if (!activity.columnHistory) {
        activity.columnHistory = [];
      }
      
      // Update the activity with the new column and add to history
      activity.columnId = columnId;
      activity.columnHistory.push(newColumnTransition);
      
      return await activity.save();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update activity column: ' + error.message);
    }
  }

  /**
   * Add tags to an activity
   */
  async addTags(activityId: string, tagIds: string[], userId: string): Promise<ActivityDocument> {
    // Find the activity
    const activity = await this.findOne(activityId);
    
    // Check if user has permission to modify this activity
    const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
      ? (activity.createdBy as any)._id.toString() 
      : String(activity.createdBy);
      
    if (createdById !== userId) {
      throw new ForbiddenException('You can only add tags to activities you created');
    }
    
    // Get current tags
    const currentTagIds = activity.tags.map(tag => {
      if (typeof tag === 'object' && tag !== null) {
        return (tag as any)._id.toString();
      }
      return (tag as any).toString();
    });
    
    // Filter out tags that are already on the activity
    const newTagIds = tagIds.filter(id => !currentTagIds.includes(id));
    
    // If no new tags, return the activity as is
    if (newTagIds.length === 0) {
      return activity;
    }
    
    // Check if adding these tags would exceed the limit
    if (currentTagIds.length + newTagIds.length > 5) {
      throw new BadRequestException(`Cannot add ${newTagIds.length} tags - would exceed the limit of 5 tags per activity (currently has ${currentTagIds.length})`);
    }
    
    // Validate the new tags
    const validatedNewTags = await this.validateTags(newTagIds, userId);
    
    // Add the tags to the activity
    const currentTags = activity.tags as any[];
    activity.tags = [...currentTags, ...validatedNewTags] as any;
    
    // Save and return the updated activity
    return activity.save();
  }
  
  /**
   * Remove tags from an activity
   */
  async removeTags(activityId: string, tagIds: string[], userId: string): Promise<ActivityDocument> {
    // Find the activity
    const activity = await this.findOne(activityId);
    
    // Check if user has permission to modify this activity
    const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null 
      ? (activity.createdBy as any)._id.toString() 
      : String(activity.createdBy);
      
    if (createdById !== userId) {
      throw new ForbiddenException('You can only remove tags from activities you created');
    }
    
    // Convert tags to string IDs for easier comparison
    const tagObjectIds = tagIds.map(id => new Types.ObjectId(id));
    
    // Remove the specified tags
    activity.tags = (activity.tags as any[]).filter(tag => {
      const tagId = typeof tag === 'object' && tag !== null 
        ? (tag as any)._id 
        : tag;
      
      return !tagObjectIds.some(id => id.equals(tagId));
    }) as any;
    
    // Save and return the updated activity
    return activity.save();
  }
} 