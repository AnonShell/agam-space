import { applyDecorators, createParamDecorator, ExecutionContext, UseGuards } from '@nestjs/common';
import { PublicShareAccessGuard } from './public-share-access.guard';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function PublicShareAccessRequired() {
  return applyDecorators(
    UseGuards(PublicShareAccessGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Invalid or expired access token' })
  );
}

export const ValidatedShareId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.shareId as string;
});
