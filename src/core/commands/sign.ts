import { Config } from '../../config/config';
import { Context, Session } from 'koishi';

export async function endfieldSign(ctx: Context, session: Session, cfg: Config) {
  try {
    const bindings = await ctx.database.get('endfield_bindings', {
      user_id: session.id,
    });

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
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
      return session.text('.signError', {
        message: signData.message || '签到失败',
      });
    }

    if (signData.data.already_signed) {
      return session.text('.alreadySigned');
    }

    const awards = signData.data.awardIds
      .map((award: any) => {
        const resourceInfo = signData.data.resourceInfoMap[award.id];
        return `${resourceInfo.name} x${award.count}`;
      })
      .join('、');

    return session.text('.signSuccess', {
      awards: awards,
    });
  } catch (error) {
    ctx.logger.error('Endfield sign error:', error);
    return session.text('endfield.networkError');
  }
}
