import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import {
  ResetCmkPasswordRequestDto,
  ResetRecoveryKeyRequestDto,
  UserKeysDto,
  UserKeysSetupDto,
} from './dto/e2ee-keys.types';
import { E2eeKeysService } from './e2ee-keys.service';
import { AuthenticatedUser } from '../auth/dto/auth.dto';

@Controller('/e2ee/keys')
@AuthRequired()
@ApiBearerAuth()
@ApiTags('E2EE Keys Management')
export class E2eeController {
  constructor(private readonly userKeysService: E2eeKeysService) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UserKeysSetupDto })
  @ApiOperation({
    summary: 'Setup Client Master Key (CMK)',
    description:
      'Initialize end-to-end encryption by setting up the Client Master Key and all user key material',
  })
  @ApiResponse({
    status: 200,
    description: 'CMK setup successful',
    type: UserKeysDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async setupCmk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UserKeysSetupDto
  ): Promise<UserKeysDto> {
    const userId = user.id;
    return this.userKeysService.setupCmk(userId, body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get encryption setup status',
    description: 'Check if CMK is setup and get user key material if available',
  })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully',
    type: UserKeysDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User keys not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getStatus(@CurrentUser() user: AuthenticatedUser): Promise<UserKeysDto> {
    const keys = await this.userKeysService.findUserKeys(user.id);
    if (!keys) {
      throw new NotFoundException('User keys not found');
    }
    return keys;
  }

  @Patch('/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update encrypted CMK with new master password',
    description: 'Update existing user keys with new encrypted CMK using master password',
  })
  @ApiBody({ type: ResetCmkPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'User keys updated successfully',
    type: UserKeysDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async resetMasterKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ResetCmkPasswordRequestDto
  ): Promise<UserKeysDto> {
    return await this.userKeysService.updateEncryptedCmkWithPassword(user.id, body);
  }

  @Patch('/recovery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update encrypted CMK with new recovery key',
    description: 'Update existing user keys with new encrypted CMK for recovery key',
  })
  @ApiBody({ type: ResetRecoveryKeyRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Recover key updated successfully',
    type: UserKeysDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async resetRecoveryKey(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ResetRecoveryKeyRequestDto
  ): Promise<UserKeysDto> {
    return await this.userKeysService.resetRecoveryKey(user.id, body);
  }
}
