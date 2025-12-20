import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthRequired, CurrentUser } from '@/modules/auth/auth.decorator';
import { AuthenticatedUser } from '@/modules/auth/dto/auth.dto';
import { QuotaService } from '@/modules/quota/quota.service';
import { UserQuotaDto } from '@/modules/quota/quota.types';
import { RequireAdmin } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('User Quota')
@ApiBearerAuth()
@AuthRequired()
@Controller('/quota')
export class UserQuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('/me')
  @ApiOperation({ summary: 'Get current user quota' })
  @ApiResponse({
    status: 200,
    description: 'Current user quota details',
    type: UserQuotaDto,
  })
  async getMyQuota(@CurrentUser() user: AuthenticatedUser): Promise<UserQuotaDto> {
    return this.getOrCreateUserQuota(user.id);
  }

  @RequireAdmin()
  @Get('/user/:userId')
  @ApiOperation({ summary: 'Get current user quota' })
  @ApiResponse({
    status: 200,
    description: 'Current user quota details',
    type: UserQuotaDto,
  })
  async getUserQuota(@Param('userId') userId: string): Promise<UserQuotaDto> {
    return this.getOrCreateUserQuota(userId);
  }

  private async getOrCreateUserQuota(userId: string): Promise<UserQuotaDto> {
    let quota = await this.quotaService.getUserQuota(userId);
    if (!quota) {
      quota = await this.quotaService.createUserQuota(userId);
    }
    return quota;
  }
}
