import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './schemas/class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { JoinClassDto } from './dto/join-class.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  /**
   * Generate a random 6-character invitation code
   */
  private generateInvitationCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    return code;
  }

  /**
   * Create a new class
   */
  async create(createClassDto: CreateClassDto, userId: string): Promise<ClassDocument> {
    // Generate a unique invitation code
    let invitationCode = this.generateInvitationCode();
    let codeExists = true;
    
    // Ensure the invitation code is unique
    while (codeExists) {
      const existingClass = await this.classModel.findOne({ invitationCode }).exec();
      if (!existingClass) {
        codeExists = false;
      } else {
        invitationCode = this.generateInvitationCode();
      }
    }
    
    // Create the new class
    const newClass = new this.classModel({
      ...createClassDto,
      invitationCode,
      createdBy: new Types.ObjectId(userId),
    });
    
    return newClass.save();
  }

  /**
   * Find all classes
   */
  async findAll(): Promise<ClassDocument[]> {
    return this.classModel.find()
      .populate('createdBy', 'name _id')
      .populate('joinedUsers', 'name _id')
      .exec();
  }

  /**
   * Find all classes created by a specific user
   */
  async findByCreator(userId: string): Promise<ClassDocument[]> {
    return this.classModel.find({ createdBy: new Types.ObjectId(userId) })
      .populate('createdBy', 'name _id')
      .populate('joinedUsers', 'name _id')
      .exec();
  }

  /**
   * Find all classes joined by a specific user
   */
  async findByJoinedUser(userId: string): Promise<ClassDocument[]> {
    return this.classModel.find({ joinedUsers: new Types.ObjectId(userId) })
      .select('-invitationCode')
      .populate('createdBy', 'name _id')
      .populate('joinedUsers', 'name _id')
      .exec();
  }

  /**
   * Find a specific class by ID
   */
  async findOne(id: string): Promise<ClassDocument> {
    const classObj = await this.classModel.findById(id)
      .populate('createdBy', 'name _id')
      .populate('joinedUsers', 'name _id')
      .exec();
      
    if (!classObj) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    
    return classObj;
  }

  /**
   * Join a class using invitation code
   */
  async joinClass(joinClassDto: JoinClassDto, userId: string, userRole: string): Promise<ClassDocument> {
    // Find the class by invitation code
    const classObj = await this.classModel.findOne({ 
      invitationCode: joinClassDto.invitationCode 
    }).exec();
    
    if (!classObj) {
      throw new NotFoundException('Class not found with the provided invitation code');
    }
    
    // Check if user is a student (only students can join classes)
    if (userRole !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can join classes');
    }
    
    // Check if user already joined this class
    const alreadyJoined = classObj.joinedUsers.some(user => 
      user.toString() === userId
    );
    
    if (alreadyJoined) {
      throw new ConflictException('You have already joined this class');
    }
    
    // Add user to the joinedUsers array using mongoose ObjectId
    classObj.joinedUsers.push(new Types.ObjectId(userId) as any);
    await classObj.save();
    
    // Return the updated class with populated fields
    const updatedClass = await this.classModel.findById(classObj._id)
      .select('-invitationCode') // Exclude invitation code
      .populate('createdBy', 'name _id') // Include only name and _id
      .populate('joinedUsers', 'name _id') // Include only name and _id
      .exec();
      
    if (!updatedClass) {
      throw new NotFoundException(`Class with ID ${classObj._id} not found`);
    }
    
    return updatedClass as ClassDocument;
  }

  /**
   * Remove a user from a class
   */
  async removeUserFromClass(classId: string, userId: string, currentUserId: string): Promise<ClassDocument> {
    const classObj = await this.findOne(classId);
    
    // Check if current user is the creator or the user themselves
    if (classObj.createdBy.toString() !== currentUserId && userId !== currentUserId) {
      throw new ForbiddenException('You do not have permission to remove this user');
    }
    
    // Remove the user from joinedUsers
    classObj.joinedUsers = classObj.joinedUsers.filter(
      user => user.toString() !== userId
    );
    
    return classObj.save();
  }

  /**
   * Delete a class
   */
  async remove(id: string, userId: string): Promise<void> {
    const classObj = await this.findOne(id);
    
    // Check if user is the creator of the class
    if (classObj.createdBy.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this class');
    }
    
    await this.classModel.findByIdAndDelete(id).exec();
  }
} 