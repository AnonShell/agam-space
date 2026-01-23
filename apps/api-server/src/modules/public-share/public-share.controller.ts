import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicShareService } from './public-share.service';
import { AuthRequired, CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/dto/auth.dto';
import {
  CreatePublicShareDto,
  PublicShareDetailsDto,
  PublicShareResponseDto,
} from './dto/public-share.dto';

@ApiTags('Public Share Management')
@ApiBearerAuth()
@AuthRequired()
@Controller('public-shares')
export class PublicShareController {
  constructor(private readonly publicShareService: PublicShareService) {}

  @Post()
  @ApiOperation({ summary: 'Create a public share' })
  @ApiResponse({
    status: 201,
    description: 'Public share created successfully',
    type: PublicShareResponseDto,
  })
  @ApiBody({ type: CreatePublicShareDto })
  @HttpCode(HttpStatus.CREATED)
  async createShare(
    @Body() body: CreatePublicShareDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PublicShareResponseDto> {
    const share = await this.publicShareService.createShare(body, user.id);
    return { id: share.id };
  }

  @Get()
  @ApiOperation({ summary: 'List public shares' })
  @ApiResponse({
    status: 200,
    description: 'List of public shares retrieved successfully',
    type: [PublicShareDetailsDto],
  })
  async listShares(@CurrentUser() user: AuthenticatedUser): Promise<PublicShareDetailsDto[]> {
    return await this.publicShareService.listShares(user.id);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a public share' })
  @ApiResponse({ status: 200, description: 'Public share revoked successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeShare(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.publicShareService.revokeShare(id, user.id);
  }
}
