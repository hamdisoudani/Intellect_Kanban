import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Class name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Class name must not exceed 50 characters' })
  name!: string;
} 