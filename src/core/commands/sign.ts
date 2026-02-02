import { Config } from '../../config/config';
import { signUser } from '../services/sign';
import { Context, Session } from 'koishi';

export async function endfieldSign(ctx: Context, session: Session, cfg: Config) {
  try {
    const result = await signUser(ctx, session.id, cfg);

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
