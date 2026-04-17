import axios from 'axios';
import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { CharacterApi, createApiClient } from '../api';
import { logPluginError } from '../errors';
import { renderCharacterCard } from '../render/char';
import { renderDetailedCharacterCard } from '../render/detailed-char';

export async function endfieldChar(ctx: Context, session: Session, cfg: Config, charName: string) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const characterApi = new CharacterApi(api);

    // Original logic if no matching character in friend detail
    const noteData = await characterApi.getNote(frameworkToken);

    const targetChar = noteData.chars.find((char) => char.name === charName);

    if (!targetChar) {
      return session.text('.charNotFound', {
        charName: charName,
      });
    }

    const instId = targetChar.id;

    const cardData = await characterApi.getCard(instId, frameworkToken);

    if (cfg.enableEndfieldPanelApi) {
      const panelDataRes = await axios.get(cfg.endfieldPanelApiUrl, {
        params: { char: charName },
        headers: {
          'X-API-KEY': cfg.apiKey,
          'X-Framework-Token': frameworkToken,
        },
      });

      if (Object.keys(panelDataRes.data).length !== 0) {
        return renderDetailedCharacterCard(ctx, cardData, panelDataRes);
      }
    }

    return renderCharacterCard(ctx, cardData);
  } catch (error) {
    logPluginError(ctx, 'endfield.char failed', error, {
      charName,
      userId: session.userId,
    });
    return session.text('endfield.networkError');
  }
}
