import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { formatSignStatsMessage, signAllUsers, signUser } from '../services/sign';

export async function endfieldSign(ctx: Context, session: Session, cfg: Config) {
  try {
    const result = await signUser(ctx, session.userId, cfg);

    if (!result.success) {
      if (result.message === '未绑定 Endfield 账号') {
        return session.text('endfield.notBoundError');
      } else if (result.message === '今日已签到') {
        return session.text('.alreadySigned');
      } else {
        return session.text('.signError', {
          message: result.message,
        });
      }
    }

    return session.text('.signSuccess', {
      awards: result.awards || '',
    });
  } catch (error) {
    ctx.logger.error('Endfield sign error:', error);
    return session.text('endfield.networkError');
  }
}

export async function endfieldSignAll(ctx: Context, session: Session, cfg: Config) {
  try {
    const stats = await signAllUsers(ctx, cfg);

    if (stats.total === 0) {
      return session.text('.noBoundUsers');
    }

    const statsMessage = formatSignStatsMessage(stats, '手动全部签到统计');
    return session.text('.signAllResult', {
      stats: statsMessage,
    });
  } catch (error) {
    ctx.logger.error('Manual sign all error:', error);
    return session.text('.signAllError');
  }
}
