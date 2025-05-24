import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Board } from '../../boards/schemas/board.schema';

export type ActivityDocument = Activity & Document;

export interface ColumnTransition {
  columnId: string;
  enteredAt: Date;
}

@Schema({ timestamps: true })
export class Activity {
  @Prop({ required: true })
  title!: string;
  
  @Prop()
  description?: string;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Board', 
    required: true 
  })
  boardId!: Board;
  
  @Prop({ type: Date })
  dueDate?: Date;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  createdBy!: User;
  
  /**
   * Type of activity: 'personal' or 'meta'
   */
  @Prop({
    type: String,
    enum: ['personal', 'meta'],
    required: true,
    default: 'personal',
  })
  type!: 'personal' | 'meta';
  
  @Prop({ 
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }],
    default: []
  })
  assignedStudents!: User[];
  
  /**
   * Current column ID of the activity on the board
   * Only used for personal activities; meta activities don't appear directly on columns
   */
  @Prop()
  columnId?: string;
  
  /**
   * History of column transitions for tracking movement across the board
   * Only used for personal activities
   */
  @Prop({
    type: [{
      columnId: { type: String, required: true },
      enteredAt: { type: Date, required: true, default: Date.now }
    }],
    default: []
  })
  columnHistory?: ColumnTransition[];
  
  @Prop({ default: false })
  isArchived!: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

// Add index for efficient querying
ActivitySchema.index({ boardId: 1 });
ActivitySchema.index({ boardId: 1, columnId: 1 });
ActivitySchema.index({ type: 1, boardId: 1 }); 