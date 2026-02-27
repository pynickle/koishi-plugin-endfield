import { Config } from '../../config/config';
import { CharacterApi, createApiClient } from '../api';
import { renderOperatorList } from '../render/note';
import { Context, Session } from 'koishi';

export async function endfieldNote(ctx: Context, session: Session, cfg: Config) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const characterApi = new CharacterApi(api);

    const noteData = await characterApi.getNote(frameworkToken);
    return renderOperatorList(ctx, noteData);
  } catch (error) {
    ctx.logger.error('Endfield note error:', error);
    return session.text('endfield.networkError');
  }
}
