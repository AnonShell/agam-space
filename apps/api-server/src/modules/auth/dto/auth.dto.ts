import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { UserSchema } from '@agam-space/shared-types';
import {
  LoginResponseSchema,
  LoginWithPasswordRequestSchema,
  NewUserSignupRequestSchema,
} from '@agam-space/shared-types';
import { UserRole } from '@agam-space/shared-types';

export class NewUserSignupRequestDto extends createZodDto(NewUserSignupRequestSchema) {}

/**
 * DTO for logout response
 */
export class LogoutResponseDto {
  @ApiProperty({
    description: 'Whether logout was successful',
    example: true,
  })
  success: boolean;
}

export class UserDto extends createZodDto(UserSchema) {}

export class LoginWithPasswordDto extends createZodDto(LoginWithPasswordRequestSchema) {}

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}
