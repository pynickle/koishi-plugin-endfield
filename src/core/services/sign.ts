import { Config } from '../../config/config';
import axios from 'axios';
import { Context } from 'koishi';

interface SignResult {
  success: boolean;
  message: string;
  awards?: string;
}

interface AutoSignStats {
  total: number;
  success: number;
  failed: number;
  failedUsers: Array<{ userId: string; message: string }>;
}

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

    const signUrl = new URL('/api/endfield/attendance', cfg.apiBaseUrl);
    const signResponse = await axios.post(
      signUrl.toString(),
      {},
      {
        headers: {
          'X-Framework-Token': frameworkToken,
          'X-API-KEY': cfg.apiKey,
        },
      }
    );

    const signData = signResponse.data;

    if (signData.code !== 0) {
      return {
        success: false,
        message: signData.message || '签到失败',
      };
    }

    if (signData.data.already_signed) {
      return {
        success: false,
        message: '今日已签到',
      };
    }

    const awards = signData.data.awardIds
      .map((award: any) => {
        const resourceInfo = signData.data.resourceInfoMap[award.id];
        return `${resourceInfo.name} x${resourceInfo.count}`;
      })
      .join('、');

    return {
      success: true,
      message: '签到成功',
      awards: awards,
    };
  } catch (error) {
    ctx.logger.error('Endfield sign error:', error);
    return {
      success: false,
      message: '网络错误',
    };
  }
}

export async function autoSignAll(ctx: Context, cfg: Config): Promise<void> {
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

    // Prepare stats message
    let message = `Endfield 自动签到统计：\n`;
    message += `总用户数：${stats.total}\n`;
    message += `成功：${stats.success}\n`;
    message += `失败：${stats.failed}\n`;

    if (stats.failed > 0) {
      message += `失败用户：\n`;
      stats.failedUsers.forEach(({ userId, message: failMsg }) => {
        message += `- 用户 ID：${userId}，原因：${failMsg}\n`;
      });
    }

    // Send message to admin QQ
    try {
      await ctx.bots[0].sendPrivateMessage(cfg.adminQQ, message);
    } catch (error) {
      ctx.logger.error('Failed to send stats to admin:', error);
    }
  } catch (error) {
    ctx.logger.error('Auto sign error:', error);
  }
}
