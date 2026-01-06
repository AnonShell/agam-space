import { ApiClientError } from '@agam-space/client';

interface FieldError {
  field: string;
  message: string;
}

export function parseError(error: unknown): {
  message: string;
  fieldErrors?: FieldError[];
} {
  if (error instanceof ApiClientError) {
    if (error.code === 'VALIDATION_ERROR' && error.details) {
      return {
        message: error.message,
        fieldErrors: error.details as FieldError[],
      };
    }
    return { message: error.message };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred' };
}
