import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserPayload } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'intellect-kanban-super-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<UserPayload> {
    const user = await this.usersService.findByEmail(payload.email);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Return payload data (will be attached to request object as req.user)
    return { 
      userId: payload.sub,
      email: payload.email,
      role: payload.role 
    };
  }
} 