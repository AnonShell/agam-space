import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthRequired, CurrentUser } from '../auth.decorator';
import { AuthenticatedUser, UserDto } from '@/modules/auth/dto/auth.dto';
import { UserService } from '@/modules/auth/user.service';

@ApiTags('User')
@ApiBearerAuth()
@AuthRequired()
@Controller('/me')
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @AuthRequired()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get current authenticated user profile and session information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    const userInfo = await this.userService.findUserById(user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return userInfo;
  }
}
