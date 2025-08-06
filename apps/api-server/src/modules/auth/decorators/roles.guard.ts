import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE_RANK, UserRole } from '@agam-space/shared-types';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { AuthGuard } from '@/modules/auth/auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector,
              private readonly authGuard: AuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const isAuthed = await this.authGuard.canActivate(context);
    if (!isAuthed) return false;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    const userRank = USER_ROLE_RANK[user?.role];
    return requiredRoles.some((required) => userRank >= USER_ROLE_RANK[required]);
  }
}
