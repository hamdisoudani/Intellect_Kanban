import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ required: true })
  name!: string;
  
  @Prop()
  description?: string;
  
  @Prop({ default: "#6366F1" }) // Default indigo color
  color!: string;
  
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  createdBy!: User;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

// Add index for more efficient querying by creator
TagSchema.index({ createdBy: 1 });

// Add compound index to ensure tags are unique per teacher
TagSchema.index({ name: 1, createdBy: 1 }, { unique: true }); 