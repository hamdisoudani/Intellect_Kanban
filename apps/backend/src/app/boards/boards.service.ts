import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Board, BoardDocument } from './schemas/board.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UserRole } from '../users/schemas/user.schema';
import { Class } from '../classes/schemas/class.schema';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @InjectModel(Class.name) private classModel: Model<Class>,
  ) {}

  /**
   * Create a new board
   */
  async create(createBoardDto: CreateBoardDto, userId: string): Promise<BoardDocument> {
    try {
      // Validate class exists
      const classObj = await this.classModel.findById(createBoardDto.classId).exec();
      if (!classObj) {
        throw new NotFoundException(`Class with ID ${createBoardDto.classId} not found`);
      }
      
      // Check if teacher is the creator of the class
      if (classObj.createdBy.toString() !== userId) {
        throw new ForbiddenException('You can only create boards for classes you have created');
      }
      
      // Create new board
      const newBoard = new this.boardModel({
        ...createBoardDto,
        createdBy: new Types.ObjectId(userId),
        // Use default columns if none provided
        columns: createBoardDto.columns || undefined
      });
      
      return await newBoard.save();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        throw new BadRequestException('Invalid board data: ' + error.message);
      }
      
      // Handle duplicate key error
      if (error.code === 11000) {
        throw new BadRequestException('A board with this name already exists for this class');
      }
      
      // Handle other errors
      throw new BadRequestException('Failed to create board: ' + error.message);
    }
  }

  /**
   * Find all boards for a class - Role based
   * For teachers: returns only boards they created for this class
   * For students: returns boards for classes they've joined
   * For admins: returns all boards for the class
   */
  async findByClass(classId: string, userId: string, userRole: string): Promise<BoardDocument[]> {
    try {
      // Check if class exists
      const classObj = await this.classModel.findById(classId).exec();
      if (!classObj) {
        throw new NotFoundException(`Class with ID ${classId} not found`);
      }

      // Check if user has access to this class
      const isCreator = classObj.createdBy.toString() === userId;
      const isJoined = classObj.joinedUsers && classObj.joinedUsers.some(
        user => user.toString() === userId
      );
      const isAdmin = userRole === UserRole.ADMIN;
      
      if (!isCreator && !isJoined && !isAdmin) {
        throw new ForbiddenException('You do not have permission to view boards for this class');
      }
      
      // Apply different queries based on role
      let query: any = { classId: new Types.ObjectId(classId) };
      
      // Teachers can only see boards they created
      if (userRole === UserRole.TEACHER && !isAdmin) {
        query.createdBy = new Types.ObjectId(userId);
      }
      
      // Return boards for this class based on role
      return this.boardModel.find(query)
        .populate('createdBy', 'name _id')
        .populate('classId', 'name _id')
        .exec();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to find boards: ' + error.message);
    }
  }

  /**
   * Find all boards from classes a student has joined
   */
  async findJoinedBoardsForStudent(studentId: string): Promise<BoardDocument[]> {
    try {
      // Find all classes the student has joined
      const joinedClasses = await this.classModel.find({
        joinedUsers: new Types.ObjectId(studentId)
      }).exec();
      
      if (!joinedClasses || joinedClasses.length === 0) {
        return []; // No joined classes, no accessible boards
      }
      
      // Extract class IDs
      const classIds = joinedClasses.map(cls => cls._id);
      
      // Find all boards for these classes
      return this.boardModel.find({
        classId: { $in: classIds }
      })
        .populate('createdBy', 'name _id')
        .populate('classId', 'name _id')
        .exec();
    } catch (error: any) {
      throw new BadRequestException('Failed to find boards from joined classes: ' + error.message);
    }
  }

  /**
   * Find all boards created by a specific user
   */
  async findByCreator(userId: string): Promise<BoardDocument[]> {
    try {
      return this.boardModel.find({ createdBy: new Types.ObjectId(userId) })
        .populate('createdBy', 'name _id')
        .populate('classId', 'name _id')
        .exec();
    } catch (error: any) {
      throw new BadRequestException('Failed to find boards: ' + error.message);
    }
  }

  /**
   * Find a board by ID (basic retrieval without access checks)
   */
  async findOne(id: string): Promise<BoardDocument> {
    try {
      const board = await this.boardModel.findById(id)
        .populate('createdBy', 'name _id')
        .populate('classId', 'name _id')
        .exec();
        
      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }
      
      return board;
    } catch (error: any) {
      // If error is MongoDB cast error (invalid ID format)
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid board ID format');
      }
      
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to find board: ' + error.message);
    }
  }

  /**
   * Find a board by ID with access check in a single operation
   * Returns the board if found and user has access, otherwise throws an exception
   */
  async findOneWithAccessCheck(id: string, userId: string, userRole: string): Promise<any> {
    try {
      const board = await this.boardModel.findById(id)
        .populate('createdBy', 'name _id')
        .populate('classId', 'name _id')
        .exec();
        
      if (!board) {
        throw new NotFoundException(`Board with ID ${id} not found`);
      }
      
      // Access check logic
      // Admin always has access
      if (userRole === UserRole.ADMIN) {
        // continue
      } else if ((board.createdBy as any)._id.toString() === userId) {
        // continue
      } else {
        // Check if user is a member of the class this board belongs to
        const classObj = await this.classModel.findById(board.classId).exec();
        if (!classObj) {
          throw new NotFoundException(`Class for this board not found`);
        }
        // Students can access boards of classes they've joined
        if (!(userRole === UserRole.STUDENT && 
            classObj.joinedUsers && 
            classObj.joinedUsers.some(user => user.toString() === userId))) {
          throw new ForbiddenException('You do not have permission to access this board');
        }
      }
      // At this point, access is granted. Now fetch students from the class
      // Populate joinedUsers with only _id and name, and filter by role = student
      const classWithStudents = await this.classModel.findById(board.classId)
        .populate({
          path: 'joinedUsers',
          select: 'name _id role',
        })
        .exec();
      const students = (classWithStudents?.joinedUsers || [])
        .filter((u: any) => u.role === 'student')
        .map((u: any) => ({ id: u._id.toString(), name: u.name }));
      // Return board details + students
      return {
        ...board.toObject(),
        students,
      };
    } catch (error: any) {
      // If error is MongoDB cast error (invalid ID format)
      if (error.name === 'CastError') {
        throw new BadRequestException('Invalid board ID format');
      }
      
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException ||
          error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to find board: ' + error.message);
    }
  }

  /**
   * Check if a user has access to a board
   */
  async checkBoardAccess(boardId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      const board = await this.findOne(boardId);
      
      // Admin always has access
      if (userRole === UserRole.ADMIN) {
        return true;
      }
      
      // Creator always has access
      if (board.createdBy.toString() === userId) {
        return true;
      }
      
      // Check if user is a member of the class this board belongs to
      const classObj = await this.classModel.findById(board.classId).exec();
      if (!classObj) {
        return false;
      }
      
      // Students can access boards of classes they've joined
      if (userRole === UserRole.STUDENT && 
          classObj.joinedUsers && 
          classObj.joinedUsers.some(user => user.toString() === userId)) {
        return true;
      }
      
      // For teachers, check if they are allowed to view other teachers' boards
      // For now, only allow creators to access their boards
      return false;
    } catch (error: any) {
      // If board doesn't exist or other errors, return false
      return false;
    }
  }

  /**
   * Delete a board
   */
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    try {
      const board = await this.findOne(id);
      
      // Check if user has permission (admin or creator)
      if (userRole !== UserRole.ADMIN && board.createdBy.toString() !== userId) {
        throw new ForbiddenException('You do not have permission to delete this board');
      }
      
      await this.boardModel.findByIdAndDelete(id).exec();
    } catch (error: any) {
      // If error is already a NestJS HTTP exception, rethrow it
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to delete board: ' + error.message);
    }
  }

  // For backward compatibility, keep the old method name and make it call the new one
  async findAccessibleToStudent(studentId: string): Promise<BoardDocument[]> {
    return this.findJoinedBoardsForStudent(studentId);
  }
} 