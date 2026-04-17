import { inspect } from 'node:util';

import { Context, Session } from 'koishi';

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

type ErrorMetadata = Record<string, unknown>;

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return String(value);
  }

  const formatted = inspect(value, {
    depth: 4,
    breakLength: 100,
    compact: false,
    sorted: true,
  });

  return formatted.length > 4000 ? `${formatted.slice(0, 4000)}\n... <truncated>` : formatted;
}

function getErrorDetails(error: unknown): Array<[string, string]> {
  if (!(error instanceof Error)) {
    return [['value', stringifyValue(error)]];
  }

  const details: Array<[string, string]> = [['name', error.name], ['message', error.message]];
  const errorWithExtras = error as Error & {
    code?: unknown;
    cause?: unknown;
    response?: {
      status?: unknown;
      statusText?: unknown;
      data?: unknown;
    };
    config?: {
      url?: unknown;
      method?: unknown;
    };
  };

  if (errorWithExtras.code !== undefined) {
    details.push(['code', stringifyValue(errorWithExtras.code)]);
  }

  if (errorWithExtras.config?.method || errorWithExtras.config?.url) {
    details.push([
      'request',
      `${String(errorWithExtras.config?.method ?? 'unknown').toUpperCase()} ${stringifyValue(errorWithExtras.config?.url ?? 'unknown')}`,
    ]);
  }

  if (errorWithExtras.response?.status !== undefined) {
    const statusText = errorWithExtras.response.statusText
      ? ` ${stringifyValue(errorWithExtras.response.statusText)}`
      : '';
    details.push(['status', `${stringifyValue(errorWithExtras.response.status)}${statusText}`]);
  }

  if (errorWithExtras.response?.data !== undefined) {
    details.push(['response', stringifyValue(errorWithExtras.response.data)]);
  }

  if (errorWithExtras.cause !== undefined) {
    details.push(['cause', stringifyValue(errorWithExtras.cause)]);
  }

  if (error.stack) {
    details.push(['stack', error.stack]);
  }

  return details;
}

function formatMetadata(metadata?: ErrorMetadata): string[] {
  if (!metadata) return [];

  return Object.entries(metadata)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `  - ${key}: ${stringifyValue(value)}`);
}

function formatErrorReport(scope: string, error: unknown, metadata?: ErrorMetadata): string {
  const lines = [`${scope}`];
  const metadataLines = formatMetadata(metadata);

  if (metadataLines.length > 0) {
    lines.push('context:');
    lines.push(...metadataLines);
  }

  lines.push('error:');
  lines.push(...getErrorDetails(error).map(([key, value]) => `  - ${key}: ${value}`));

  return lines.join('\n');
}

export function logPluginError(
  ctx: Context,
  scope: string,
  error: unknown,
  metadata?: ErrorMetadata
) {
  ctx.logger.error(formatErrorReport(scope, error, metadata));
}

export function logPluginWarn(
  ctx: Context,
  scope: string,
  error: unknown,
  metadata?: ErrorMetadata
) {
  ctx.logger.warn(formatErrorReport(scope, error, metadata));
}

export async function tryDeleteOnebotMessage(
  ctx: Context,
  session: Session,
  messageId?: string | number,
  metadata?: ErrorMetadata
) {
  if (!session.onebot || messageId === undefined) return false;

  try {
    await session.onebot.deleteMsg(messageId);
    return true;
  } catch (error) {
    logPluginWarn(ctx, 'Failed to delete OneBot message. Continuing without interruption.', error, {
      channelId: session.channelId,
      guildId: session.guildId,
      messageId,
      userId: session.userId,
      ...metadata,
    });
    return false;
  }
}

export async function sendReplyImage(
  ctx: Context,
  session: Session,
  image: string,
  extractImageSrc: (image: string) => string = () => '',
  metadata?: ErrorMetadata
) {
  const imageSrc = extractImageSrc(image) || image;

  if (!session.onebot || !session.messageId || !imageSrc) {
    return false;
  }

  const reply = { type: 'reply', data: { id: session.messageId } };
  const imageMsg = { type: 'image', data: { file: imageSrc } };
  const targetChannelId = session.channelId || session.guildId;

  try {
    if (targetChannelId) {
      await session.onebot.sendGroupMsg(targetChannelId, [reply, imageMsg]);
      return true;
    }

    await session.onebot.sendPrivateMsg(session.userId, [reply, imageMsg]);
    return true;
  } catch (error) {
    logPluginWarn(ctx, 'Failed to send reply image. Falling back to the default send flow.', error, {
      channelId: session.channelId,
      guildId: session.guildId,
      messageId: session.messageId,
      userId: session.userId,
      ...metadata,
    });
    return false;
  }
}

export function handleError(ctx: Context, error: unknown, scope: string = 'Unhandled Endfield error'): string {
  if (error instanceof EndfieldError) {
    logPluginError(ctx, `${scope} [${error.code}]`, error, {
      endfieldMessage: error.message,
      originalError: error.originalError,
    });
    return error.message;
  }

  if (error instanceof Error) {
    logPluginError(ctx, scope, error);
    return '网络错误';
  }

  logPluginError(ctx, scope, error);
  return '未知错误';
}
