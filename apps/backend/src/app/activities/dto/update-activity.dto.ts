import { IsString, IsOptional, IsDateString, IsEnum, IsArray, IsMongoId, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DifficultyLevel } from '../schemas/activity.schema';

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
  
  /**
   * Tags associated with the activity
   */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  tags?: string[];
  
  /**
   * Difficulty level of the activity
   */
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficultyLevel?: DifficultyLevel;
  
  /**
   * Estimated time to complete in minutes
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1440) // Max 24 hours
  @Type(() => Number)
  estimatedTimeMinutes?: number;
} 