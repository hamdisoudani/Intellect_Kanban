import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name, role } = signupDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    await this.usersService.create({
      email,
      password: hashedPassword,
      name,
      role,
    });

    // Return success message without JWT token
    return {
      success: true,
      message: 'Account created successfully',
      role: role
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, expectedRole } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    
    // Check if the user's role matches the expected role
    if (user.role !== expectedRole) {
      // Use a generic error message for security
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Generate JWT token
    const payload: JwtPayload = { 
      email: user.email, 
      sub: (user as any)._id.toString(), 
      role: user.role 
    };
    
    return {
      success: true,
      token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        id: (user as any)._id.toString(),
      }
    };
  }

  private async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
} 