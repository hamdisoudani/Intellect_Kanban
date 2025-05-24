import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  // Allow only alphanumeric characters and spaces
  @Matches(/^[a-zA-Z0-9 ]+$/, { 
    message: 'Name must contain only letters, numbers, and spaces' 
  })
  name!: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  // Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @IsNotEmpty()
  @IsEnum([UserRole.TEACHER, UserRole.STUDENT], { 
    message: 'Role must be either teacher or student' 
  })
  role!: UserRole;
} 