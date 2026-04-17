import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { CharacterApi, createApiClient } from '../api';
import { logPluginError, logPluginWarn, sendReplyImage } from '../errors';
import { renderOperatorList } from '../render/note';

function extractImageSrc(image: string) {
  const match = image.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
  return match ? match[1] : '';
}

export async function endfieldNote(ctx: Context, session: Session, cfg: Config) {
  try {
    if (session.onebot && session.messageId) {
      try {
        await session.onebot._request('set_msg_emoji_like', {
          message_id: session.messageId,
          emoji_id: 147,
        });
      } catch (error) {
        logPluginWarn(ctx, 'Failed to set message emoji like. Continuing without interruption.', error, {
          command: 'endfield.note',
          messageId: session.messageId,
          userId: session.userId,
        });
      }
    }

    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const characterApi = new CharacterApi(api);

    const noteData = await characterApi.getNote(frameworkToken);
    const image = await renderOperatorList(ctx, noteData, cfg.noteAvatarStyle);
    if (
      await sendReplyImage(ctx, session, image, extractImageSrc, {
        command: 'endfield.note',
      })
    ) {
      return;
    }

    return image;
  } catch (error) {
    logPluginError(ctx, 'endfield.note failed', error, {
      userId: session.userId,
    });
    return session.text('endfield.networkError');
  }
}
