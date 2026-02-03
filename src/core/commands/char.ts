import { Config } from '../../config/config';
import { renderCharacterCard } from '../render/char';
import axios from 'axios';
import { Context, Session } from 'koishi';

export async function endfieldChar(ctx: Context, session: Session, cfg: Config, charName: string) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const noteUrl = new URL('/api/endfield/note', cfg.apiBaseUrl);
    const noteResponse = await axios.get(noteUrl.toString(), {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const noteData = noteResponse.data;

    if (noteData.code !== 0) {
      return session.text('commands.endfield.card.messages.noteError', {
        message: noteData.message,
      });
    }

    const targetChar = noteData.data.chars.find((char: any) => char.name === charName);

    if (!targetChar) {
      return session.text('commands.endfield.card.messages.charNotFound', {
        charName: charName,
      });
    }

    const instId = targetChar.id;

    const cardUrl = new URL('/api/endfield/card/char', cfg.apiBaseUrl);
    const cardResponse = await axios.get(cardUrl.toString(), {
      params: {
        instId: instId,
      },
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const cardData = cardResponse.data;

    if (cardData.code !== 0) {
      return session.text('commands.endfield.card.messages.cardError', {
        message: cardData.message,
      });
    }

    return renderCharacterCard(ctx, cardData.data);
  } catch (error) {
    ctx.logger.error('Endfield card error:', error);
    return session.text('endfield.networkError');
  }
}
