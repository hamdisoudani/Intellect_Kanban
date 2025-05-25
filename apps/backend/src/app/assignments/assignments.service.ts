import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './schemas/assignment.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { UserRole } from '../users/schemas/user.schema';
import { Activity } from '../activities/schemas/activity.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  /**
   * Create assignments for multiple students for a specific activity
   */
  async createBatch(createAssignmentDto: CreateAssignmentDto, boardId: string): Promise<AssignmentDocument[]> {
    const { activityId, studentIds, notes } = createAssignmentDto;
    
    // Find activity to make sure it exists and get the board ID
    const activity = await this.activityModel.findById(activityId).exec();
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }
    
    // Update the activity with the assigned students
    activity.assignedStudents = [...new Set([
      ...activity.assignedStudents.map(s => s.toString()),
      ...studentIds
    ])].map(id => new Types.ObjectId(id)) as any;
    
    await activity.save();
    
    // Create assignments for each student
    const assignments: Assignment[] = [];
    
    for (const studentId of studentIds) {
      // Check if assignment already exists for this student and activity
      const existingAssignment = await this.assignmentModel.findOne({
        activityId: new Types.ObjectId(activityId),
        studentId: new Types.ObjectId(studentId)
      }).exec();
      
      if (existingAssignment) {
        continue; // Skip if assignment already exists
      }
      
      // Create new assignment
      const newAssignment = new this.assignmentModel({
        activityId: new Types.ObjectId(activityId),
        studentId: new Types.ObjectId(studentId),
        boardId: new Types.ObjectId(boardId),
        notes,
        columnId: 'backlog', // Default column
        position: 0, // Default position
        columnHistory: [{ columnId: 'backlog', enteredAt: new Date() }]
      });
      
      assignments.push(newAssignment);
    }
    
    // Save all assignments
    if (assignments.length > 0) {
      await this.assignmentModel.insertMany(assignments);
    }
    
    // Return all assignments for this activity, including existing ones
    return this.assignmentModel.find({ 
      activityId: new Types.ObjectId(activityId) 
    })
      .populate('studentId', 'name _id')
      .populate('activityId', 'title _id')
      .exec();
  }

  /**
   * Find all assignments for a specific activity
   */
  async findByActivity(activityId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel.find({ activityId: new Types.ObjectId(activityId) })
      .populate('studentId', 'name _id')
      .populate('activityId', 'title _id')
      .exec();
  }

  /**
   * Find all assignments for a specific student
   */
  async findByStudent(studentId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel.find({ studentId: new Types.ObjectId(studentId) })
      .populate('activityId', 'title description dueDate _id')
      .populate('boardId', 'name columns _id')
      .exec();
  }

  /**
   * Find all assignments for a specific board
   */
  async findByBoard(boardId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel.find({ boardId: new Types.ObjectId(boardId) })
      .populate('studentId', 'name _id')
      .populate('activityId', 'title _id')
      .exec();
  }

  /**
   * Find all assignments for a specific board and student with full activity details
   */
  async findByBoardAndStudent(boardId: string, studentId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel.find({ 
      boardId: new Types.ObjectId(boardId),
      studentId: new Types.ObjectId(studentId)
    })
      .populate({
        path: 'activityId',
        select: 'title description dueDate tags difficultyLevel estimatedTimeMinutes type createdBy createdAt updatedAt',
        populate: {
          path: 'tags',
          select: '_id name description color'
        }
      })
      .populate('studentId', '_id name')
      .sort({ position: 1 })
      .exec();
  }

  /**
   * Find a specific assignment by ID
   */
  async findOne(id: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel.findById(id)
      .populate('studentId', 'name _id')
      .populate('activityId', 'title _id')
      .populate('boardId', 'columns _id')
      .exec();
      
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }
    
    return assignment;
  }

  /**
   * Update an assignment (move to a different column)
   */
  async update(id: string, updateAssignmentDto: UpdateAssignmentDto, userId: string, userRole: string): Promise<AssignmentDocument> {
    const assignment = await this.findOne(id);
    const { columnId, position, notes } = updateAssignmentDto;
    
    // Check if user is authorized to update this assignment
    // Students can only update their own assignments
    if (userRole === UserRole.STUDENT) {
      // Handle both populated and non-populated studentId scenarios
      const assignmentStudentId = typeof assignment.studentId === 'string' 
        ? assignment.studentId 
        : (assignment.studentId as any)._id?.toString() || assignment.studentId.toString();
      
      if (assignmentStudentId !== userId) {
        throw new ForbiddenException('You can only update your own assignments');
      }
    }
    
    // Check if column has changed
    const columnChanged = assignment.columnId !== columnId;
    
    // Update assignment
    if (columnId) assignment.columnId = columnId;
    if (position !== undefined) assignment.position = position;
    if (notes) assignment.notes = notes;
    
    // Add column transition to history if column changed
    if (columnChanged) {
      assignment.columnHistory.push({
        columnId,
        enteredAt: new Date()
      });
    }
    
    return assignment.save();
  }

  /**
   * Add feedback to an assignment
   */
  async addFeedback(id: string, content: string, userId: string): Promise<AssignmentDocument> {
    const assignment = await this.findOne(id);
    
    assignment.feedback.push({
      content,
      createdBy: new Types.ObjectId(userId) as any,
      createdAt: new Date(),
      readByStudent: false
    });
    
    return assignment.save();
  }

  /**
   * Mark feedback as read
   */
  async markFeedbackAsRead(id: string, userId: string): Promise<AssignmentDocument> {
    const assignment = await this.findOne(id);
    
    // Ensure only the student assigned can mark feedback as read
    // Handle both populated and non-populated studentId scenarios
    const assignmentStudentId = typeof assignment.studentId === 'string' 
      ? assignment.studentId 
      : (assignment.studentId as any)._id?.toString() || assignment.studentId.toString();
    
    if (assignmentStudentId !== userId) {
      throw new ForbiddenException('You can only mark feedback as read for your own assignments');
    }
    
    // Mark all feedback as read
    assignment.feedback = assignment.feedback.map(feedback => ({
      ...feedback,
      readByStudent: true
    }));
    
    return assignment.save();
  }

  /**
   * Delete an assignment
   */
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const assignment = await this.findOne(id);
    
    // Only teachers who created the activity or admins can delete assignments
    const activity = await this.activityModel.findById(assignment.activityId).exec();
    
    if (userRole !== UserRole.ADMIN && activity?.createdBy.toString() !== userId) {
      throw new ForbiddenException('You do not have permission to delete this assignment');
    }
    
    await this.assignmentModel.findByIdAndDelete(id).exec();
    
    // Remove student from activity's assignedStudents if this was their only assignment
    const otherAssignments = await this.assignmentModel.find({
      activityId: assignment.activityId,
      studentId: assignment.studentId,
      _id: { $ne: id }
    }).exec();
    
    if (otherAssignments.length === 0 && activity) {
      // Remove student from assignedStudents
      activity.assignedStudents = activity.assignedStudents.filter(
        student => student.toString() !== assignment.studentId.toString()
      );
      
      await activity.save();
    }
  }
} 