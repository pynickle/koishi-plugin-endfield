import { Config } from '../../config/config';
import { renderAnnouncement } from '../render/announcement';
import axios from 'axios';
import { Context, Session } from 'koishi';

export async function endfieldAnnouncement(ctx: Context, session: Session, cfg: Config) {
  try {
    // Get latest announcement from API
    const announcementUrl = new URL('/api/announcements/latest', cfg.apiBaseUrl);
    const announcementResponse = await axios.get(announcementUrl.toString(), {
      headers: {
        'X-API-KEY': cfg.apiKey,
      },
    });

    const announcementData = announcementResponse.data;
    if (announcementData.code !== 0) {
      return session.text('.announcementError', {
        message: announcementData.message,
      });
    }

    const announcement = announcementData.data;
    if (!announcement) {
      return session.text('.announcementNotFound');
    }
    // Send announcement
    return renderAnnouncement(ctx, announcement);
  } catch (error) {
    ctx.logger.error('Endfield announcement error:', error);
    return session.text('endfield.networkError');
  }
}
