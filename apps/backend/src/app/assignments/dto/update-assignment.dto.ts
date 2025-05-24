import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateAssignmentDto {
  @IsString()
  columnId!: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  notes?: string;
} 