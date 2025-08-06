import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { UserRole } from '@agam-space/shared-types';
import { RolesGuard } from '@/modules/auth/decorators/roles.guard';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

export const RequireAdmin = () => RequireRoles(UserRole.ADMIN);
export const RequireOwner = () => RequireRoles(UserRole.OWNER);

export function RequireRoles(...roles: UserRole[]) {
  return applyDecorators(
    Roles(...roles),
    UseGuards(RolesGuard),
  );
}
