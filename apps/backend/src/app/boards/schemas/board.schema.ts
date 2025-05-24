import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Class } from '../../classes/schemas/class.schema';

export type BoardDocument = Board & Document;

export interface Column {
  id: string;
  name: string;
  order: number;
}

@Schema({ timestamps: true })
export class Board {
  @Prop({ required: true })
  name!: string;
  
  @Prop()
  description?: string;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  })
  classId!: Class;
  
  @Prop({
    type: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      order: { type: Number, required: true }
    }],
    default: [
      { id: 'backlog', name: 'Backlog', order: 0 },
      { id: 'doing', name: 'Doing', order: 1 },
      { id: 'review', name: 'Review', order: 2 },
      { id: 'done', name: 'Done', order: 3 }
    ]
  })
  columns!: Column[];
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  createdBy!: User;
}

export const BoardSchema = SchemaFactory.createForClass(Board); 