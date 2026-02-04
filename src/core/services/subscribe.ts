import { Config } from '../../config/config';
import axios from 'axios';
import dayjs from 'dayjs';
import { Context, h } from 'koishi';

export async function checkSubscriptions(ctx: Context, cfg: Config) {
  try {
    const currentTime = dayjs().format('HH:mm');

    // Get all activity subscriptions for current time
    const activitySubscriptions = await ctx.database.get('endfield_subscriptions', {});
    // Get all stamina subscriptions
    const staminaSubscriptions = await ctx.database.get('endfield_stamina_subscriptions', {});

    // Combine all subscriptions by user_id to avoid duplicate API calls
    const userSubscriptions = new Map<
      string,
      {
        activity?: any;
        stamina?: any;
      }
    >();

    // Add activity subscriptions
    for (const subscription of activitySubscriptions) {
      if (subscription.time === currentTime) {
        if (!userSubscriptions.has(subscription.user_id)) {
          userSubscriptions.set(subscription.user_id, {});
        }
        userSubscriptions.get(subscription.user_id).activity = subscription;
      }
    }

    // Add stamina subscriptions
    for (const subscription of staminaSubscriptions) {
      if (!userSubscriptions.has(subscription.user_id)) {
        userSubscriptions.set(subscription.user_id, {});
      }
      userSubscriptions.get(subscription.user_id).stamina = subscription;
    }

    // Check each user's subscriptions
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
    // Get user binding
    const bindings = await ctx.database.get('endfield_bindings_v3', user_id);
    if (bindings.length === 0) return;

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    // Get stamina info (only one API call)
    const staminaUrl = new URL('/api/endfield/stamina', cfg.apiBaseUrl);
    const staminaResponse = await axios.get(staminaUrl.toString(), {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const staminaData = staminaResponse.data;
    if (staminaData.code !== 0) return;

    const { dailyMission, stamina } = staminaData.data;

    // Check activity subscription
    if (subs.activity) {
      const { group_id } = subs.activity;
      // Check if daily mission activation is not max
      if (dailyMission.activation < dailyMission.maxActivation) {
        // Send reminder to group
        await ctx.bots[0].sendMessage(
          group_id,
          h('at', { id: user_id }) + ' 提醒：您的每日活跃度尚未满格，请上线完成每日任务！'
        );
      }
    }

    // Check stamina subscription
    if (subs.stamina) {
      const { group_id, duration, reminder_interval, last_reminded_at } = subs.stamina;
      // Calculate time until stamina is full
      const maxTs = parseInt(stamina.maxTs);
      const now = dayjs().unix();
      const timeUntilFull = maxTs - now;

      // Parse duration string to seconds (time until full threshold)
      const durationSeconds = parseIntervalToSeconds(duration);
      // Parse reminder interval string to seconds (minimum time between reminders)
      const reminderIntervalSeconds = parseIntervalToSeconds(reminder_interval);

      // Check if time until full is less than duration
      if (timeUntilFull > 0 && timeUntilFull < durationSeconds) {
        // Get last reminded timestamp
        const lastReminded = dayjs(last_reminded_at);
        const lastRemindedUnix = lastReminded.unix();

        // Check if enough time has passed since last reminder
        const timeSinceLastReminder = now - lastRemindedUnix;

        // Only send reminder if enough time has passed since last reminder
        if (timeSinceLastReminder >= reminderIntervalSeconds) {
          // Send reminder to group
          await ctx.bots[0].sendMessage(
            group_id,
            h('at', { id: user_id }) + ' 提醒：您的体力即将恢复满，请及时上线使用！'
          );

          // Update last reminded time
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
  const regex = /(\d+)([hms])/g;
  let seconds = 0;
  let match;

  while ((match = regex.exec(interval)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'h':
        seconds += value * 3600;
        break;
      case 'm':
        seconds += value * 60;
        break;
      case 's':
        seconds += value;
        break;
    }
  }

  return seconds;
}
