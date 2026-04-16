import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { CharacterApi, createApiClient } from '../api';
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
        ctx.logger.warn('Failed to set msg emoji like:', error);
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
    const imageSrc = extractImageSrc(image) || image;

    if (session.onebot && session.messageId && imageSrc) {
      const reply = { type: 'reply', data: { id: session.messageId } };
      const imageMsg = { type: 'image', data: { file: imageSrc } };
      if (session.guildId) {
        await session.onebot.sendGroupMsg(session.guildId, [reply, imageMsg]);
        return;
      }
      await session.onebot.sendPrivateMsg(session.userId, [reply, imageMsg]);
      return;
    }

    return image;
  } catch (error) {
    ctx.logger.error('Endfield note error:', error);
    return session.text('endfield.networkError');
  }
}
