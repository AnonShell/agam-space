import { Controller, Post, Get, Delete, Body, Param, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '@/modules/auth/auth.decorator';
import { RequireAdmin } from '@/modules/auth/decorators/roles.decorator';
import { CreateInviteRequestDto, CreateInviteResponseDto } from './dto/invite.dto';
import { InviteCodesService } from './invite-codes.service';
import { CreateInviteResponse } from '@agam-space/shared-types';

@ApiTags('Invite Codes')
@RequireAdmin()
@AuthRequired()
@Controller('/admin/invite-codes')
export class InviteCodesController {
  constructor(private inviteCodesService: InviteCodesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create invite code' })
  @ApiResponse({ status: 201, description: 'Invite created', type: CreateInviteResponseDto })
  @ApiBody({ type: CreateInviteRequestDto })
  async createInvite(
    @CurrentUser() user: { id: string },
    @Body() body: CreateInviteRequestDto
  ): Promise<CreateInviteResponse> {
    return this.inviteCodesService.createInvite(user.id, body);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invite codes' })
  async listInvites(@CurrentUser() user: { id: string }) {
    return this.inviteCodesService.listInvites(user.id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke invite code' })
  async revokeInvite(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    const revoked = await this.inviteCodesService.revokeInvite(id, user.id);
    if (!revoked) {
      throw new BadRequestException('Invite code not found');
    }
    return { success: true };
  }
}
