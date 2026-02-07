import { Config } from '../config/config';
import { CRON_SCHEDULES } from '../constants';
import { checkAnnouncements } from './services/announcements';
import { fetchAndSaveCharPools } from './services/char-pools';
import { autoSignAll } from './services/sign';
import { checkSubscriptions } from './services/subscribe';
import { Context } from 'koishi';

export function registerCronJobs(ctx: Context, cfg: Config) {
  ctx.cron(CRON_SCHEDULES.AUTO_SIGN, async () => {
    await autoSignAll(ctx, cfg);
  });

  ctx.cron(CRON_SCHEDULES.FETCH_CHAR_POOLS, async () => {
    await fetchAndSaveCharPools(ctx, cfg);
  });

  ctx.cron(CRON_SCHEDULES.CHECK_SUBSCRIPTIONS, async () => {
    await checkSubscriptions(ctx, cfg);
  });

  ctx.cron(CRON_SCHEDULES.CHECK_ANNOUNCEMENTS, async () => {
    await checkAnnouncements(ctx, cfg);
  });
}

export async function initializeServices(ctx: Context, cfg: Config) {
  await fetchAndSaveCharPools(ctx, cfg);
  await checkAnnouncements(ctx, cfg);
}
