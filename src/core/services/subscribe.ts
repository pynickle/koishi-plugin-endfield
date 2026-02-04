import { Config } from '../../config/config';
import axios from 'axios';
import { Context, h } from 'koishi';

export async function checkSubscriptions(ctx: Context, cfg: Config) {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Get all subscriptions for current time
    const subscriptions = await ctx.database.get('endfield_subscriptions', {});

    for (const subscription of subscriptions) {
      if (subscription.time === currentTime) {
        await checkUserStamina(ctx, cfg, subscription);
      }
    }
  } catch (error) {
    ctx.logger.error('Check subscriptions error:', error);
  }
}

async function checkUserStamina(ctx: Context, cfg: Config, subscription: any) {
  try {
    const { user_id, group_id } = subscription;

    // Get user binding
    const bindings = await ctx.database.get('endfield_bindings_v3', user_id);
    if (bindings.length === 0) return;

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    // Get stamina info
    const staminaUrl = new URL('/api/endfield/stamina', cfg.apiBaseUrl);
    const staminaResponse = await axios.get(staminaUrl.toString(), {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const staminaData = staminaResponse.data;
    if (staminaData.code !== 0) return;

    const { dailyMission } = staminaData.data;

    // Check if daily mission activation is not max
    if (dailyMission.activation < dailyMission.maxActivation) {
      // Send reminder to group
      await ctx.bots[0].sendMessage(
        group_id,
        h('at', { id: user_id }) + ' 提醒：您的每日活跃度尚未满格，请上线完成每日任务！'
      );
    }
  } catch (error) {
    ctx.logger.error('Check user stamina error:', error);
  }
}
