export class AppError extends Error {
  errorCode: string;
  errorMessage: string;

  constructor(message: string, details?: { errorCode?: string; errorMessage?: string }) {
    super(message);
    this.name = 'AppError';
    this.errorCode = details?.errorCode || 'APP_ERROR';
    this.errorMessage = details?.errorMessage || message;
  }
}

export class AlreadyExistsError extends AppError {
  constructor(message: string, details?: { errorCode?: string; errorMessage?: string }) {
    super(message);
    this.name = 'AlreadyExistsError';
    this.errorCode = details?.errorCode || 'ALREADY_EXISTS';
    this.errorMessage = details?.errorMessage || message;
  }
}

export class DecryptionError extends AppError {
  constructor(message: string, details?: { errorCode?: string; errorMessage?: string }) {
    super(message, details);
    this.name = 'DecryptionError';
    this.errorCode = details?.errorCode || 'DECRYPTION_ERROR';
    this.errorMessage = details?.errorMessage || message;
  }
}
