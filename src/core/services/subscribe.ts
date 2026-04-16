import dayjs from 'dayjs';
import { Context, h } from 'koishi';

import { Config } from '../../config/config';
import { parseCustomTime } from '../../utils/time-utils';
import { StaminaApi, createApiClient } from '../api';

export async function checkSubscriptions(ctx: Context, cfg: Config) {
  try {
    const currentTime = dayjs().format('HH:mm');

    const activitySubscriptions = await ctx.database.get('endfield_subscriptions', {});
    const staminaSubscriptions = await ctx.database.get('endfield_stamina_subscriptions', {});

    const userSubscriptions = new Map<
      string,
      {
        activity?: any;
        stamina?: any;
      }
    >();

    for (const subscription of activitySubscriptions) {
      if (subscription.time === currentTime) {
        if (!userSubscriptions.has(subscription.user_id)) {
          userSubscriptions.set(subscription.user_id, {});
        }
        userSubscriptions.get(subscription.user_id).activity = subscription;
      }
    }

    for (const subscription of staminaSubscriptions) {
      if (!userSubscriptions.has(subscription.user_id)) {
        userSubscriptions.set(subscription.user_id, {});
      }
      userSubscriptions.get(subscription.user_id).stamina = subscription;
    }

    for (const [user_id, subs] of userSubscriptions) {
      await checkUserSubscriptions(ctx, cfg, user_id, subs);
    }
  } catch (error) {
    ctx.logger.error('Check subscriptions error:', error);
  }
}

async function checkUserSubscriptions(
  ctx: Context,
  cfg: Config,
  user_id: string,
  subs: {
    activity?: any;
    stamina?: any;
  }
) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', user_id);
    if (bindings.length === 0) return;

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const staminaApi = new StaminaApi(api);

    const staminaData = await staminaApi.getStamina(frameworkToken);

    const { dailyMission, stamina } = staminaData;

    if (subs.activity) {
      const { group_id } = subs.activity;
      if (dailyMission.activation < dailyMission.maxActivation) {
        await ctx.bots[0].sendMessage(
          group_id,
          h('at', { id: user_id }) + ' 提醒：您的每日活跃度尚未满格，请上线完成每日任务！'
        );
      }
    }

    if (subs.stamina) {
      const { group_id, duration, reminder_interval, last_reminded_at } = subs.stamina;
      const maxTs = parseInt(stamina.maxTs);
      const now = dayjs().unix();
      const timeUntilFull = maxTs - now;

      const durationSeconds = parseIntervalToSeconds(duration);
      const reminderIntervalSeconds = parseIntervalToSeconds(reminder_interval);

      if (timeUntilFull > 0 && timeUntilFull < durationSeconds) {
        const lastReminded = dayjs(last_reminded_at);
        const lastRemindedUnix = lastReminded.unix();

        const timeSinceLastReminder = now - lastRemindedUnix;

        if (timeSinceLastReminder >= reminderIntervalSeconds) {
          await ctx.bots[0].sendMessage(
            group_id,
            h('at', { id: user_id }) + ' 提醒：您的体力即将恢复满，请及时上线使用！'
          );

          await ctx.database.set('endfield_stamina_subscriptions', user_id, {
            last_reminded_at: dayjs().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    ctx.logger.error('Check user subscriptions error:', error);
  }
}

function parseIntervalToSeconds(interval: string): number {
  const ms = parseCustomTime(interval);
  return ms ? ms / 1000 : 0;
}
