import { IsString, IsOptional, IsHexColor, MaxLength } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MaxLength(50)
  name!: string;
  
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
  
  @IsHexColor()
  @IsOptional()
  color?: string;
} 