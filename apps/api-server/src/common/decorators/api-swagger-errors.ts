import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function SwaggerApiStandardErrors() {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Invalid request data' }),
    ApiResponse({ status: 401, description: 'Not authenticated' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 500, description: 'Internal server error' })
  );
}
