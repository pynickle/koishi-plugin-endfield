import { Context, h, Session } from 'koishi';

import { logPluginWarn } from './errors';

export type MessageId = string | number;

export interface BotSelector {
  platform?: string;
  selfId?: string;
}

export interface ChannelTarget extends BotSelector {
  channelId: string;
}

type MessageMetadata = Record<string, unknown>;

export function resolveBot(ctx: Context, selector: BotSelector = {}) {
  const { platform, selfId } = selector;

  if (!platform && !selfId) return ctx.bots[0];

  return ctx.bots.find((bot) => {
    if (platform && bot.platform !== platform) return false;
    if (selfId && bot.selfId !== selfId) return false;
    return true;
  });
}

function formatBotSelector(selector: BotSelector) {
  const parts = [
    selector.platform ? `platform=${selector.platform}` : '',
    selector.selfId ? `selfId=${selector.selfId}` : '',
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'first available bot';
}

export async function sendSessionMessage(session: Session, content: string) {
  const messageIds = await session.send(content);
  return Array.isArray(messageIds) ? messageIds[0] : undefined;
}

export async function tryDeleteMessage(
  ctx: Context,
  session: Session,
  messageId?: MessageId,
  metadata?: MessageMetadata
) {
  if (messageId === undefined || !session.channelId) return false;

  try {
    await session.bot.deleteMessage(session.channelId, String(messageId));
    return true;
  } catch (error) {
    logPluginWarn(ctx, 'Failed to delete message. Continuing without interruption.', error, {
      channelId: session.channelId,
      guildId: session.guildId,
      messageId,
      platform: session.platform,
      selfId: session.bot?.selfId,
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
  metadata?: MessageMetadata
) {
  const extractedImageSrc = extractImageSrc(image);
  const htmlImageMatch = image.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  const imageSrc = extractedImageSrc || htmlImageMatch?.[1] || image;

  if (!session.messageId || !imageSrc) return false;

  try {
    await session.send(`${h.quote(session.messageId)}${h.image(imageSrc)}`);
    return true;
  } catch (error) {
    logPluginWarn(
      ctx,
      'Failed to send reply image. Falling back to the default send flow.',
      error,
      {
        channelId: session.channelId,
        guildId: session.guildId,
        messageId: session.messageId,
        platform: session.platform,
        selfId: session.bot?.selfId,
        userId: session.userId,
        ...metadata,
      }
    );
    return false;
  }
}

export async function sendChannelMessage(ctx: Context, target: ChannelTarget, content: string) {
  const bot = resolveBot(ctx, target);
  if (!bot) {
    throw new Error(
      `No matching bot instance available to send channel message: ${formatBotSelector(target)}`
    );
  }

  await bot.sendMessage(target.channelId, content);
  return true;
}

export async function sendPrivateMessage(
  ctx: Context,
  selector: BotSelector,
  userId: string,
  content: string
) {
  const bot = resolveBot(ctx, selector);
  if (!bot) {
    throw new Error(
      `No matching bot instance available to send private message: ${formatBotSelector(selector)}`
    );
  }

  await bot.sendPrivateMessage(userId, content);
  return true;
}
