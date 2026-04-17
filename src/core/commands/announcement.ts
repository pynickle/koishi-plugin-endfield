import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { AnnouncementApi, createApiClient } from '../api';
import { ApiError, NotFoundError, logPluginError } from '../errors';
import { renderAnnouncement } from '../render/announcement';

export async function endfieldAnnouncement(ctx: Context, session: Session, cfg: Config) {
  try {
    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const announcementApi = new AnnouncementApi(api);

    const announcement = await announcementApi.getLatest();

    return renderAnnouncement(ctx, announcement);
  } catch (error) {
    if (error instanceof ApiError) {
      return session.text('.announcementError', {
        message: error.message,
      });
    }

    if (error instanceof NotFoundError) {
      return session.text('.announcementNotFound');
    }

    logPluginError(ctx, 'endfield.announcement failed', error, {
      userId: session.userId,
    });
    return session.text('endfield.networkError');
  }
}
