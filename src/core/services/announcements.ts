import { Config } from '../../config/config';
import { renderAnnouncement } from '../render/announcement';
import axios from 'axios';
import dayjs from 'dayjs';
import { Context, h } from 'koishi';

const ANNOUNCEMENTS_SERVICE_ID = 'endfield_announcements_service';

export async function checkAnnouncements(ctx: Context, cfg: Config) {
  try {
    // Get announcements from API
    const announcementsUrl = new URL('/api/announcements', cfg.apiBaseUrl);
    const announcementsResponse = await axios.get(announcementsUrl.toString(), {
      headers: {
        'X-API-KEY': cfg.apiKey,
      },
    });

    const announcementsData = announcementsResponse.data;
    if (announcementsData.code !== 0) {
      ctx.logger.error('Get announcements error:', announcementsData.message);
      return;
    }

    const announcements = announcementsData.data.list;
    if (!announcements || !Array.isArray(announcements)) {
      ctx.logger.error('Invalid announcements data');
      return;
    }

    // Filter announcements to only include those with item_id
    const validAnnouncements = announcements.filter((ann: any) => ann.item_id);
    if (validAnnouncements.length === 0) {
      ctx.logger.error('No valid announcement found');
      return;
    }

    // Get latest announcement
    const latestAnnouncement = validAnnouncements[0];

    // Get last saved announcement ID from database
    const savedAnnouncements = await ctx.database.get(
      'endfield_announcements',
      ANNOUNCEMENTS_SERVICE_ID
    );
    const lastAnnouncementId =
      savedAnnouncements.length > 0 ? savedAnnouncements[0].last_announcement_id : null;

    // Check if this is a new announcement
    if (!lastAnnouncementId) {
      // First run, save the latest announcement ID and skip sending
      await saveLatestAnnouncementId(ctx, latestAnnouncement.item_id);
      ctx.logger.info('First run: saved latest announcement ID:', latestAnnouncement.item_id);
      return;
    }

    // Find all new announcements (from last saved ID to latest)
    const newAnnouncements = [];
    let foundLast = false;

    for (const announcement of validAnnouncements) {
      if (announcement.item_id === lastAnnouncementId) {
        foundLast = true;
        break;
      }
      newAnnouncements.push(announcement);
    }

    // If found last saved ID, send all new announcements
    if (foundLast && newAnnouncements.length > 0) {
      // Send announcements in reverse order (oldest first)
      for (const announcement of newAnnouncements.reverse()) {
        await handleNewAnnouncement(ctx, cfg, announcement);
      }
      // Update to latest announcement ID
      await saveLatestAnnouncementId(ctx, latestAnnouncement.item_id);
    } else if (!foundLast) {
      // Last saved ID not found (e.g., announcements were cleared), save latest and skip
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
  const existing = await ctx.database.get('endfield_announcements', ANNOUNCEMENTS_SERVICE_ID);

  if (existing.length > 0) {
    await ctx.database.set('endfield_announcements', ANNOUNCEMENTS_SERVICE_ID, {
      last_announcement_id: announcementId,
      updated_at: dayjs().toISOString(),
    });
  } else {
    await ctx.database.create('endfield_announcements', {
      id: ANNOUNCEMENTS_SERVICE_ID,
      last_announcement_id: announcementId,
      updated_at: dayjs().toISOString(),
    });
  }
}

async function handleNewAnnouncement(ctx: Context, cfg: Config, announcement: any) {
  try {
    const announcementImage = await renderAnnouncement(ctx, announcement);

    // Use groups from config
    const groups = cfg.announcementGroups;

    // Send announcement to all configured groups
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
