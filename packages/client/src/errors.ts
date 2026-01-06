export class AppError extends Error {
  code: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code || 'APP_ERROR';
  }
}

export class AlreadyExistsError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code || 'ALREADY_EXISTS');
    this.name = 'AlreadyExistsError';
  }
}

export class DecryptionError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code || 'DECRYPTION_ERROR');
    this.name = 'DecryptionError';
  }
}
