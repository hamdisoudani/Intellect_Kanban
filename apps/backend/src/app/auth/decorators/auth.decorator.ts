import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../users/schemas/user.schema';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

/**
 * Combined decorator for JWT authentication and optional role-based authorization
 * 
 * @param roles Optional roles to restrict access to
 * @returns Decorator
 */
export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    UseGuards(AuthGuard('jwt'), RolesGuard),
    roles.length ? Roles(...roles) : () => {},
  );
} 