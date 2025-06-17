import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tag, TagDocument } from './schemas/tag.schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Activity } from '../activities/schemas/activity.schema';

@Injectable()
export class TagsService {
  constructor(
    @InjectModel(Tag.name) private tagModel: Model<TagDocument>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  /**
   * Create a new tag
   */
  async create(createTagDto: CreateTagDto, userId: string): Promise<TagDocument> {
    try {
      const newTag = new this.tagModel({
        ...createTagDto,
        createdBy: new Types.ObjectId(userId)
      });
      
      return await newTag.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException('You already have a tag with this name');
      }
      throw new BadRequestException('Failed to create tag: ' + error.message);
    }
  }

  /**
   * Create multiple tags at once
   */
  async createMultiple(tags: CreateTagDto[], userId: string): Promise<TagDocument[]> {
    if (!tags || tags.length === 0) {
      return [];
    }
    
    const tagsToCreate = tags.map(tag => ({
      ...tag,
      createdBy: new Types.ObjectId(userId),
      color: tag.color || "#6366F1" // Ensure color is always defined
    }));
    
    try {
      return this.tagModel.insertMany(tagsToCreate, { ordered: false }) as unknown as TagDocument[];
    } catch (error: any) {
      if (error.code === 11000) {
        // Some tags were duplicates, but others might have been created
        // Get the successfully created tags
        const createdTags = await this.findByUser(userId);
        return createdTags.filter(tag => 
          tags.some(newTag => newTag.name === tag.name)
        );
      }
      throw new BadRequestException('Failed to create tags: ' + error.message);
    }
  }

  /**
   * Find all tags created by a specific user
   */
  async findByUser(userId: string): Promise<TagDocument[]> {
    return this.tagModel.find({ 
      createdBy: new Types.ObjectId(userId) 
    }).sort({ name: 1 }).exec();
  }

  /**
   * Find a specific tag by ID
   */
  async findOne(id: string): Promise<TagDocument> {
    const tag = await this.tagModel.findById(id).exec();
    
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    
    return tag;
  }

  /**
   * Update a tag
   */
  async update(id: string, updateTagDto: UpdateTagDto, userId: string): Promise<TagDocument> {
    const tag = await this.findOne(id);
    
    // Verify ownership
    if (tag.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update tags you created');
    }
    
    // Update tag properties
    Object.assign(tag, updateTagDto);
    
    return tag.save();
  }

  /**
   * Delete a tag and remove all references to it from activities
   */
  async remove(id: string, userId: string): Promise<void> {
    const tag = await this.findOne(id);
    
    // Verify ownership
    if (tag.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete tags you created');
    }
    
    // Use MongoDB transaction to ensure atomicity
    const session = await this.tagModel.db.startSession();
    session.startTransaction();
    
    try {
      // 1. Remove the tag from all activities that reference it
      await this.activityModel.updateMany(
        { tags: new Types.ObjectId(id) },
        { $pull: { tags: new Types.ObjectId(id) } }
      ).session(session);
      
      // 2. Delete the tag itself
      await this.tagModel.findByIdAndDelete(id).session(session);
      
      // Commit the transaction
      await session.commitTransaction();
    } catch (error) {
      // If anything goes wrong, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  }

  /**
   * Get tag usage data for analytics dashboard
   * Returns the top 5 most used tags for a specific teacher
   */
  async getTagUsageForTeacher(teacherId: string): Promise<any[]> {
    const teacherObjectId = new Types.ObjectId(teacherId);
    
    // Get all tags for this teacher
    const teacherTags = await this.tagModel.find({ 
      createdBy: teacherObjectId 
    }).exec();
    
    if (teacherTags.length === 0) {
      return [];
    }
    
    const tagIds = teacherTags.map(tag => tag._id);
    
    // Aggregate tag usage count from activities
    const results = await this.activityModel.aggregate([
      {
        $match: { 
          createdBy: teacherObjectId,
          tags: { $in: tagIds }
        }
      },
      {
        $unwind: "$tags"
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]).exec();
    
    // Get tag names for the IDs
    const tagMap = new Map<string, string>();
    for (const tag of teacherTags) {
      if (tag._id && tag.name) {
        tagMap.set(tag._id.toString(), tag.name);
      }
    }
    
    // Format the results
    return results.map(result => ({
      tagName: tagMap.get(result._id.toString()) || 'Unknown',
      count: result.count
    }));
  }
} 