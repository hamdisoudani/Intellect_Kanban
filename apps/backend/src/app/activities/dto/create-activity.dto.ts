import { IsString, IsOptional, IsDateString, IsMongoId, IsIn, IsArray, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator, ValidationOptions, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ColumnTransition, DifficultyLevel } from '../schemas/activity.schema';

// Custom validator for assignedStudents/type relationship
@ValidatorConstraint({ name: 'ActivityTypeAssignedStudents', async: false })
class ActivityTypeAssignedStudentsConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const { type, assignedStudents } = args.object as any;
    if (type === 'personal') {
      return !assignedStudents || assignedStudents.length === 0;
    }
    // For meta, assignedStudents can be empty or undefined
    return true;
  }
  defaultMessage(args: ValidationArguments) {
    const { type } = args.object as any;
    if (type === 'personal') {
      return 'Personal activities cannot have assigned students.';
    }
    return 'Invalid activity type or assigned students.';
  }
}

function ActivityTypeAssignedStudents(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: ActivityTypeAssignedStudentsConstraint,
    });
  };
}

// Custom validator for dueDate in the future
@ValidatorConstraint({ name: 'IsFutureDate', async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return true;
    const date = new Date(value);
    return date > new Date();
  }
  defaultMessage() {
    return 'Due date must be in the future.';
  }
}

function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

// Custom validator for columnId based on activity type
@ValidatorConstraint({ name: 'PersonalActivityColumnId', async: false })
class PersonalActivityColumnIdConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const { type, columnId } = args.object as any;
    
    // Only personal activities need a columnId
    if (type === 'personal') {
      return !!columnId; // columnId should be present for personal activities
    }
    
    // For meta activities, columnId is not required
    return true;
  }
  
  defaultMessage(args: ValidationArguments) {
    const { type } = args.object as any;
    if (type === 'personal') {
      return 'Personal activities require a column ID.';
    }
    return 'Invalid column data for activity type.';
  }
}

function PersonalActivityColumnId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PersonalActivityColumnIdConstraint,
    });
  };
}

// Column transition nested DTO
class ColumnTransitionDto implements ColumnTransition {
  @IsString()
  columnId!: string;
  
  enteredAt: Date = new Date();
}

export class CreateActivityDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  boardId!: string;

  @IsDateString()
  @IsOptional()
  @IsFutureDate({ message: 'Due date must be in the future.' })
  dueDate?: string;

  /**
   * Type of activity: 'personal' or 'meta'
   */
  @IsString()
  @IsIn(['personal', 'meta'])
  type!: 'personal' | 'meta';

  /**
   * Column ID for personal activities - required for UI placement
   * The backend will automatically track column history
   */
  @IsString()
  @IsOptional()
  @PersonalActivityColumnId({ message: 'Personal activities require a valid column ID.' })
  columnId?: string;

  /**
   * Assigned students (for meta activities, optional)
   */
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ActivityTypeAssignedStudents({ message: 'Invalid assigned students for activity type.' })
  assignedStudents?: string[];
  
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