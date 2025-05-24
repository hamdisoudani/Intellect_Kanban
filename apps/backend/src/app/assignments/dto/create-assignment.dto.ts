import { IsString, IsOptional, IsMongoId, IsArray } from 'class-validator';

export class CreateAssignmentDto {
  @IsMongoId()
  activityId!: string;

  @IsMongoId({ each: true })
  @IsArray()
  studentIds!: string[];

  @IsString()
  @IsOptional()
  notes?: string;
} 