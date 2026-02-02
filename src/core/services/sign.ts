import { Config } from '../../config/config';
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
  failedUsers: Array<{ userId: number; message: string }>;
}

export async function signUser(ctx: Context, userId: number, cfg: Config): Promise<SignResult> {
  try {
    const bindings = await ctx.database.get('endfield_bindings', {
      user_id: userId,
    });

    if (bindings.length === 0) {
      return {
        success: false,
        message: '未绑定 Endfield 账号',
      };
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const signUrl = new URL('/api/endfield/attendance', cfg.apiBaseUrl);
    const signResponse = await fetch(signUrl, {
      method: 'POST',
      headers: {
        'X-Framework-Token': frameworkToken,
      },
    });

    const signData = await signResponse.json();

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
        return `${resourceInfo.name} x${award.count}`;
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
      message: '网络错误，请检查 Endfield API 是否可访问',
    };
  }
}

export async function autoSignAll(ctx: Context, cfg: Config): Promise<AutoSignStats> {
  const stats: AutoSignStats = {
    total: 0,
    success: 0,
    failed: 0,
    failedUsers: [],
  };

  try {
    const bindings = await ctx.database.get('endfield_bindings', {});
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
    ctx.logger.error('Auto sign error:', error);
  }

  return stats;
}
