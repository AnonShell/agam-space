import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { UserSchema } from '@agam-space/shared-types';
import {
  LoginResponseSchema,
  LoginWithPasswordRequestSchema,
  NewUserSignupRequestSchema,
  ChangeLoginPasswordRequestSchema,
} from '@agam-space/shared-types';
import { UserRole } from '@agam-space/shared-types';

export class NewUserSignupRequestDto extends createZodDto(NewUserSignupRequestSchema) {}

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

export class ChangeLoginPasswordRequestDto extends createZodDto(ChangeLoginPasswordRequestSchema) {}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}
