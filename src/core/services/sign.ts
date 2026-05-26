import { Context } from 'koishi';

import { Config } from '../../config/config';
import type { SignResult, AutoSignStats } from '../../types';
import { SignApi, createApiClient } from '../api';
import { logPluginError } from '../errors';
import { sendPrivateMessage } from '../messaging';

export async function signUser(ctx: Context, userId: string, cfg: Config): Promise<SignResult> {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', userId);

    if (bindings.length === 0) {
      return {
        success: false,
        message: '未绑定 Endfield 账号',
      };
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const signApi = new SignApi(api);

    const signData = await signApi.sign(frameworkToken);

    if (signData.already_signed) {
      return {
        success: false,
        message: '今日已签到',
      };
    }

    const awards = signData.awardIds
      .map((award) => {
        const resourceInfo = signData.resourceInfoMap[award.id];
        return `${resourceInfo.name} x${resourceInfo.count}`;
      })
      .join('、');

    return {
      success: true,
      message: '签到成功',
      awards: awards,
    };
  } catch (error) {
    logPluginError(ctx, 'endfield.sign service failed', error, {
      userId,
    });
    return {
      success: false,
      message: '网络错误',
    };
  }
}

export async function autoSignAll(ctx: Context, cfg: Config): Promise<void> {
  const stats = await signAllUsers(ctx, cfg);
  const message = formatSignStatsMessage(stats, 'Endfield 自动签到统计');

  if (!cfg.adminUserId) {
    ctx.logger.warn('No admin user ID configured to send auto sign stats.');
    return;
  }

  try {
    await sendPrivateMessage(
      ctx,
      { platform: cfg.adminPlatform, selfId: cfg.adminBotSelfId },
      cfg.adminUserId,
      message
    );
  } catch (error) {
    logPluginError(ctx, 'Failed to send auto sign stats to admin', error, {
      adminUserId: cfg.adminUserId,
      platform: cfg.adminPlatform,
      selfId: cfg.adminBotSelfId,
    });
  }
}

export async function signAllUsers(ctx: Context, cfg: Config): Promise<AutoSignStats> {
  const stats: AutoSignStats = {
    total: 0,
    success: 0,
    failed: 0,
    failedUsers: [],
  };

  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', {});
    const userIds = Array.from(new Set(bindings.map((binding) => binding.user_id)));

    stats.total = userIds.length;

    for (const userId of userIds) {
      const result = await signUser(ctx, userId, cfg);
      ctx.logger.info(`Auto sign for user ${userId}: ${result.message}`);

      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
        stats.failedUsers.push({ userId, message: result.message });
      }
    }
  } catch (error) {
    logPluginError(ctx, 'endfield.signall service failed', error);
  }

  return stats;
}

export function formatSignStatsMessage(stats: AutoSignStats, title: string): string {
  let message = `${title}：\n`;
  message += `总用户数：${stats.total}\n`;
  message += `成功：${stats.success}\n`;
  message += `失败：${stats.failed}\n`;

  if (stats.failed > 0) {
    message += '失败用户：\n';
    stats.failedUsers.forEach(({ userId, message: failMsg }) => {
      message += `- 用户 ID：${userId}，原因：${failMsg}\n`;
    });
  }

  return message.trimEnd();
}
