import { Config } from '../../config/config';
import axios from 'axios';
import { Context, Session } from 'koishi';

export async function endfieldCard(ctx: Context, session: Session, cfg: Config, charName: string) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', {
      user_id: session.userId,
    });

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const noteUrl = new URL('/api/endfield/note', cfg.apiBaseUrl);
    const noteResponse = await fetch(noteUrl, {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const noteData = await noteResponse.json();

    if (noteData.code !== 0) {
      return session.text('commands.endfield.card.messages.noteError', {
        message: noteData.message,
      });
    }

    if (!noteData.data || !noteData.data.chars) {
      return session.text('commands.endfield.card.messages.noteFormatError');
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

    if (!cardData.data) {
      return session.text('commands.endfield.card.messages.cardFormatError');
    }

    return session.send(`<img src="${cardData.data.imageUrl}"/>`);
  } catch (error) {
    ctx.logger.error('Endfield card error:', error);
    return session.text('endfield.networkError');
  }
}
