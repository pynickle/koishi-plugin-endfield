import { Context } from 'koishi';

export class EndfieldError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'EndfieldError';
  }
}

export class NetworkError extends EndfieldError {
  constructor(originalError?: unknown) {
    super('网络错误', 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class ApiError extends EndfieldError {
  constructor(
    message: string,
    public apiCode: number,
    originalError?: unknown
  ) {
    super(message, 'API_ERROR', originalError);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends EndfieldError {
  constructor(message: string) {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends EndfieldError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export function handleError(ctx: Context, error: unknown): string {
  if (error instanceof EndfieldError) {
    ctx.logger.error(`[${error.code}] ${error.message}`, error.originalError);
    return error.message;
  }

  if (error instanceof Error) {
    ctx.logger.error(error.message, error);
    return '网络错误';
  }

  ctx.logger.error('Unknown error:', error);
  return '未知错误';
}
