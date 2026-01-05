import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from '@/modules/auth/user.service';
import { SwaggerApiStandardErrors } from '@/common/decorators/api-swagger-errors';
import { RequireAdmin } from '@/modules/auth/decorators/roles.decorator';
import { UpdateUserStatusDto } from '../dto/admin.dto';
import { UpdateUserQuotaDto } from '@/modules/quota/dto/quota-admin.dto';
import { AuthService } from '../services/auth.service';
import { CurrentUser } from '../auth.decorator';
import { AuthenticatedUser } from '../dto/auth.dto';
import { QuotaService } from '@/modules/quota/quota.service';
import { UserWithQuota } from '@agam-space/shared-types';

@ApiTags('Users')
@Controller('/admin/users')
export class AdminUserController {
  private readonly logger = new Logger(AdminUserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly quotaService: QuotaService
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all users',
    description: 'Retrieve a list of all registered users with their quota information.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users with quota',
  })
  @SwaggerApiStandardErrors()
  @RequireAdmin()
  @ApiBearerAuth()
  async listUsers(): Promise<UserWithQuota[]> {
    return await this.userService.listUsers();
  }

  @Patch(':userId/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user status',
    description:
      'Change user status (active, disabled, deleted). Admins cannot modify their own status.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: 204,
    description: 'User status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify own account status',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @SwaggerApiStandardErrors()
  @RequireAdmin()
  @ApiBearerAuth()
  async updateUserStatus(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() body: UpdateUserStatusDto
  ): Promise<void> {
    await this.authService.updateUserStatus(admin.id, userId, body.status);
  }

  @Patch(':userId/quota')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Update user quota',
    description: 'Update storage quota for a user',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiBody({ type: UpdateUserQuotaDto })
  @ApiResponse({
    status: 204,
    description: 'User quota updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or quota not found',
  })
  @SwaggerApiStandardErrors()
  @RequireAdmin()
  @ApiBearerAuth()
  async updateUserQuota(
    @Param('userId') userId: string,
    @Body() body: UpdateUserQuotaDto
  ): Promise<void> {
    await this.quotaService.updateUserQuota(userId, body.totalStorageQuota);
  }
}
