import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activity, ActivityDocument } from './schemas/activity.schema';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UserRole } from '../users/schemas/user.schema';
import { Board, BoardDocument } from '../boards/schemas/board.schema';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { TagsService } from '../tags/tags.service';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { BoardGateway } from '../websockets/board.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    private readonly tagsService: TagsService,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly assignmentsService: AssignmentsService,
    private readonly boardGateway: BoardGateway
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


        // Fallback to unpopulated activity
        return savedActivity; 
      }
      if (createActivityDto.type === 'meta') {
        // Check if a meta activity with the same name already exists in this board
        const existingActivity = await this.activityModel.findOne({
          title: createActivityDto.title,
          boardId: createActivityDto.boardId,
          type: 'meta'
        }).exec();
        
        if (existingActivity) {
          throw new BadRequestException('A class activity with this name already exists in this board.');
        }
        
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
          const assignments = await this.assignmentsService.createBatch({
            activityId: (savedActivity._id as Types.ObjectId).toString(),
            studentIds: validStudentIds.map(id => id.toString()),
          }, (board as any)._id.toString());
          
          
        }
        
        // Populate the tag information before returning
        const populatedActivity = await this.activityModel.findById(savedActivity._id)
          .populate('createdBy', 'name _id')
          .populate('assignedStudents', 'name _id')
          .populate('tags', '_id name color')
          .exec();

        // Emit real-time update
        if (populatedActivity) {
          
          return populatedActivity;
        }

        return savedActivity; // Fallback to unpopulated activity if population fails
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
      // Otherwise, wrap it in a BadRequestException
      throw new BadRequestException(
        error.message || 'Failed to create activity'
      );
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
      // Find the activity first to get its boardId for notifications
      const activity = await this.activityModel.findById(id).exec();
      if (!activity) {
        throw new NotFoundException(`Activity with ID ${id} not found`);
      }

      // Store boardId for later use in notifications
      const boardId = activity.boardId.toString();
      
      // Check if user has permission
      if (userRole === UserRole.STUDENT) {
        throw new ForbiddenException('Students cannot delete activities');
      }

      if (userRole === UserRole.TEACHER) {
        const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null
          ? (activity.createdBy as any)._id.toString()
          : String(activity.createdBy);
        if (createdById !== userId) {
          throw new ForbiddenException('Teachers can only delete their own activities');
        }
      }

      // For meta activities, also delete associated assignments
      if (activity.type === 'meta') {
        await this.assignmentsService.removeByActivityId(id);
      }

      // Delete the activity
      const result = await this.activityModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Activity with ID ${id} not found`);
      }
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to delete activity');
    }
  }

  /**
   * Update the column of a personal activity
   */
  async updateColumn(activityId: string, columnId: string, userId: string): Promise<ActivityDocument> {
    try {
      // Find the activity
      const activity = await this.activityModel.findById(activityId).exec();
      if (!activity) {
        throw new NotFoundException(`Activity with ID ${activityId} not found`);
      }

      // Verify this is a personal activity
      if (activity.type !== 'personal') {
        throw new BadRequestException('Only personal activities can be moved between columns');
      }

      // Verify the user is the creator of the activity
      const createdById = activity.createdBy instanceof Types.ObjectId
        ? activity.createdBy.toString()
        : (activity.createdBy as any)._id?.toString();
      if (createdById !== userId) {
        throw new ForbiddenException('You can only move activities you have created');
      }

      // Update the column and add to history
      activity.columnId = columnId;
      const columnTransition = {
        columnId,
        enteredAt: new Date()
      };

      // Initialize columnHistory if it doesn't exist
      if (!activity.columnHistory) {
        activity.columnHistory = [];
      }

      activity.columnHistory.push(columnTransition);
      await activity.save();

      // Populate references before returning
      const populatedActivity = await this.activityModel.findById(activityId)
        .populate('createdBy', 'name _id')
        .populate('tags', '_id name color')
        .exec();

      // Emit real-time update
      if (populatedActivity) {
        
        return populatedActivity;
      }
      
      return activity;
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to update activity column'
      );
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

  /**
   * Update an activity
   */
  async update(id: string, updateActivityDto: UpdateActivityDto, userId: string, userRole: string): Promise<ActivityDocument> {
    try {
      // Find the activity first to check permissions
      const activity = await this.findOne(id);
      
      // Check if user has permission
      if (userRole === UserRole.STUDENT) {
        throw new ForbiddenException('Students cannot update activities');
      }

      if (userRole === UserRole.TEACHER) {
        const createdById = typeof activity.createdBy === 'object' && activity.createdBy !== null
          ? (activity.createdBy as any)._id.toString()
          : String(activity.createdBy);
        if (createdById !== userId) {
          throw new ForbiddenException('Teachers can only update their own activities');
        }
      }

      // If we're updating the title and it's a meta activity, check for duplicates
      if (updateActivityDto.title && activity.type === 'meta') {
        // Check if another meta activity with the same name already exists in this board
        const existingActivity = await this.activityModel.findOne({
          _id: { $ne: new Types.ObjectId(id) }, // Exclude current activity
          title: updateActivityDto.title,
          boardId: activity.boardId,
          type: 'meta'
        }).exec();
        
        if (existingActivity) {
          throw new BadRequestException('A class activity with this name already exists in this board');
        }
      }

      // Check due date is in the future if provided
      if (updateActivityDto.dueDate) {
        const dueDate = new Date(updateActivityDto.dueDate);
        if (dueDate <= new Date()) {
          throw new BadRequestException('Due date must be in the future');
        }
      }

      // Validate tags if provided
      if (updateActivityDto.tags) {
        updateActivityDto.tags = await this.validateTags(updateActivityDto.tags, userId) as any;
      }

      // Update the activity
      const updatedActivity = await this.activityModel.findByIdAndUpdate(
        id,
        { $set: updateActivityDto },
        { new: true } // Return the updated document
      )
      .populate('createdBy', 'name _id')
      .populate('assignedStudents', 'name _id')
      .populate('tags', '_id name color')
      .exec();

      if (!updatedActivity) {
        throw new NotFoundException(`Activity with ID ${id} not found`);
      }

      // For meta activities, notify all assigned students about the update
      if (updatedActivity.type === 'meta' && updatedActivity.assignedStudents && updatedActivity.assignedStudents.length > 0) {
        // Get the boardId
        const boardId = typeof updatedActivity.boardId === 'string' 
          ? updatedActivity.boardId 
          : updatedActivity.boardId.toString();
        
        // Extract student IDs from the assignedStudents array
        const studentIds = updatedActivity.assignedStudents.map(student => 
          typeof student === 'object' ? 
            (student as any)._id?.toString() || (student as any).toString() : 
            (student as any).toString()
        );
        
        // Notify assigned students about the meta activity update
        this.boardGateway.notifyStudentsAboutMetaActivityUpdate(
          boardId, 
          studentIds, 
          updatedActivity
        );
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
      throw new BadRequestException(error.message || 'Failed to update activity');
    }
  }

  /**
   * Get boards for a list of class IDs
   * For analytics purposes
   */
  async getBoardsByClassIds(classIds: any[]): Promise<any[]> {
    return this.boardModel.find({ 
      classId: { $in: classIds.map(id => new Types.ObjectId(id)) } 
    }).exec();
  }

  /**
   * Get boards for a specific class ID
   * For analytics purposes
   */
  async getBoardsByClassId(classId: any): Promise<any[]> {
    return this.boardModel.find({ 
      classId: new Types.ObjectId(classId)
    }).exec();
  }

  /**
   * Count activities created by a teacher, filtered by type
   * For analytics purposes
   */
  async countActivitiesByTypeAndTeacher(
    teacherId: string,
    type: 'personal' | 'meta'
  ): Promise<number> {
    return this.activityModel.countDocuments({
      createdBy: new Types.ObjectId(teacherId),
      type
    }).exec();
  }

  /**
   * Get activity creation data broken down by month
   * For analytics dashboard
   */
  async getActivityCreationByMonth(
    teacherId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // Convert to Types.ObjectId
    const teacherObjectId = new Types.ObjectId(teacherId);
    
    // Use aggregation to group activities by month and type
    const results = await this.activityModel.aggregate([
      {
        $match: {
          createdBy: teacherObjectId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          type: 1
        }
      },
      {
        $group: {
          _id: { 
            year: "$year",
            month: "$month",
            type: "$type"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]).exec();
    
    // Transform the results to the format needed by the frontend
    const monthsMap: { [key: number]: string } = {
      1: 'January',
      2: 'February',
      3: 'March',
      4: 'April',
      5: 'May',
      6: 'June',
      7: 'July',
      8: 'August',
      9: 'September',
      10: 'October',
      11: 'November',
      12: 'December'
    };
    
    // Create a map to store data for each month
    const monthlyData: Record<string, {month: string, personal: number, meta: number}> = {};
    
    // Initialize with all months in the range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      const key = `${year}-${month}`;
      const monthName = `${monthsMap[month]} ${year}`;
      
      monthlyData[key] = {
        month: monthName,
        personal: 0,
        meta: 0
      };
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Fill in actual data
    for (const result of results) {
      const { year, month, type } = result._id;
      const key = `${year}-${month}`;
      
      if (monthlyData[key] && (type === 'personal' || type === 'meta')) {
        // Use type assertion to tell TypeScript this is safe
        monthlyData[key][type as 'personal' | 'meta'] = result.count;
      }
    }
    
    // Convert the map to an array
    return Object.values(monthlyData);
  }
} 