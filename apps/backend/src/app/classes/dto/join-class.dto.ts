import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinClassDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Invitation code must be exactly 6 characters long' })
  invitationCode!: string;
} 