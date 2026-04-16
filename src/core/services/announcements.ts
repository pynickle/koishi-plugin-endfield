import dayjs from 'dayjs';
import { Context } from 'koishi';

import { Config } from '../../config/config';
import { DATABASE_IDS } from '../../constants';
import { AnnouncementApi, createApiClient } from '../api';
import { renderAnnouncement } from '../render/announcement';

export async function checkAnnouncements(ctx: Context, cfg: Config) {
  try {
    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const announcementApi = new AnnouncementApi(api);

    const announcements = await announcementApi.getList();

    if (!announcements || !Array.isArray(announcements)) {
      ctx.logger.error('Invalid announcements data');
      return;
    }

    const validAnnouncements = announcements.filter((ann) => ann.item_id);
    if (validAnnouncements.length === 0) {
      ctx.logger.error('No valid announcement found');
      return;
    }

    const latestAnnouncement = validAnnouncements[0];

    const savedAnnouncements = await ctx.database.get(
      'endfield_announcements',
      DATABASE_IDS.ANNOUNCEMENTS_SERVICE
    );
    const lastAnnouncementId =
      savedAnnouncements.length > 0 ? savedAnnouncements[0].last_announcement_id : null;

    if (!lastAnnouncementId) {
      await saveLatestAnnouncementId(ctx, latestAnnouncement.item_id);
      ctx.logger.info('First run: saved latest announcement ID:', latestAnnouncement.item_id);
      return;
    }

    const newAnnouncements = [];
    let foundLast = false;

    for (const announcement of validAnnouncements) {
      if (announcement.item_id === lastAnnouncementId) {
        foundLast = true;
        break;
      }
      newAnnouncements.push(announcement);
    }

    if (foundLast && newAnnouncements.length > 0) {
      for (const announcement of newAnnouncements.reverse()) {
        await handleNewAnnouncement(ctx, cfg, announcement);
      }
      await saveLatestAnnouncementId(ctx, latestAnnouncement.item_id);
    } else if (!foundLast) {
      await saveLatestAnnouncementId(ctx, latestAnnouncement.item_id);
      ctx.logger.warn(
        'Last saved announcement ID not found, saved latest:',
        latestAnnouncement.item_id
      );
    }
  } catch (error) {
    ctx.logger.error('Check announcements error:', error);
  }
}

async function saveLatestAnnouncementId(ctx: Context, announcementId: string) {
  const existing = await ctx.database.get(
    'endfield_announcements',
    DATABASE_IDS.ANNOUNCEMENTS_SERVICE
  );

  if (existing.length > 0) {
    await ctx.database.set('endfield_announcements', DATABASE_IDS.ANNOUNCEMENTS_SERVICE, {
      last_announcement_id: announcementId,
      updated_at: dayjs().toISOString(),
    });
  } else {
    await ctx.database.create('endfield_announcements', {
      id: DATABASE_IDS.ANNOUNCEMENTS_SERVICE,
      last_announcement_id: announcementId,
      updated_at: dayjs().toISOString(),
    });
  }
}

async function handleNewAnnouncement(ctx: Context, cfg: Config, announcement: any) {
  try {
    const announcementImage = await renderAnnouncement(ctx, announcement);

    const groups = cfg.announcementGroups;

    for (const groupId of groups) {
      try {
        await ctx.bots[0].sendMessage(groupId, announcementImage);
      } catch (error) {
        ctx.logger.error(`Send announcement to group ${groupId} error:`, error);
      }
    }

    ctx.logger.info('New announcement sent:', announcement.item_id);
  } catch (error) {
    ctx.logger.error('Handle new announcement error:', error);
  }
}
