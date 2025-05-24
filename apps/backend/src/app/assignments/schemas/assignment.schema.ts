import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Activity } from '../../activities/schemas/activity.schema';
import { Board } from '../../boards/schemas/board.schema';

export type AssignmentDocument = Assignment & Document;

export interface ColumnTransition {
  columnId: string;
  enteredAt: Date;
}

export interface FeedbackEntry {
  content: string;
  createdBy: User;
  createdAt: Date;
  readByStudent: boolean;
}

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Activity', 
    required: true 
  })
  activityId!: Activity;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  studentId!: User;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Board', 
    required: true 
  })
  boardId!: Board;
  
  @Prop({ required: true, default: 'backlog' })
  columnId!: string;
  
  @Prop({ default: 0 })
  position!: number;
  
  @Prop()
  notes?: string;
  
  @Prop({
    type: [{
      columnId: { type: String, required: true },
      enteredAt: { type: Date, required: true, default: Date.now }
    }],
    default: [{ columnId: 'backlog', enteredAt: new Date() }]
  })
  columnHistory!: ColumnTransition[];
  
  @Prop({
    type: [{
      content: { type: String, required: true },
      createdBy: { type: MongooseSchema.Types.ObjectId, ref: 'User', required: true },
      createdAt: { type: Date, required: true, default: Date.now },
      readByStudent: { type: Boolean, default: false }
    }],
    default: []
  })
  feedback!: FeedbackEntry[];
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// Add indexes for efficient querying
AssignmentSchema.index({ activityId: 1, studentId: 1 }, { unique: true });
AssignmentSchema.index({ boardId: 1, studentId: 1 });
AssignmentSchema.index({ boardId: 1, columnId: 1 }); 