import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';

// Define the allowed roles
enum UserRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Expected role must be either teacher or student' })
  expectedRole!: string;
} 