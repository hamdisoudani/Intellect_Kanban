import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsNumber()
  order!: number;
}

export class CreateBoardDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  classId!: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ColumnDto)
  columns?: ColumnDto[];
} 