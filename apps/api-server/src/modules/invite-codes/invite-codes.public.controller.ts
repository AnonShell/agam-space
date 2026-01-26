import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { InviteCodesService } from './invite-codes.service';
import { ValidateInviteCodeResponse } from '@agam-space/shared-types';

@ApiTags('Invite Codes Public')
@Controller('/invite-codes')
export class InviteCodesPublicController {
  constructor(private readonly inviteCodesService: InviteCodesService) {}

  @Get('validate/:id')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Validate invite code' })
  async validateInviteCode(@Param('id') id: string): Promise<ValidateInviteCodeResponse> {
    return this.inviteCodesService.validateInviteCode(id);
  }
}
