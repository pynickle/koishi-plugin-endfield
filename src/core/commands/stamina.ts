import axios from 'axios';
import dayjs from 'dayjs';
import { Context, Session } from 'koishi';

import { Config } from '../../config/config';

export async function endfieldStamina(ctx: Context, session: Session, cfg: Config) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const staminaUrl = new URL('/api/endfield/stamina', cfg.apiBaseUrl);
    const staminaResponse = await axios.get(staminaUrl.toString(), {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const staminaData = staminaResponse.data;

    if (staminaData.code !== 0) {
      return session.text('.staminaError', {
        message: staminaData.message,
      });
    }

    const { role, stamina, dailyMission } = staminaData.data;

    // Convert maxTs to readable time
    const maxTs = parseInt(stamina.maxTs);
    const formattedTime = dayjs.unix(maxTs).format('YYYY-MM-DD HH:mm');

    return session.text('.staminaSuccess', {
      name: role.name,
      level: role.level,
      current: stamina.current,
      max: stamina.max,
      activation: dailyMission.activation,
      maxActivation: dailyMission.maxActivation,
      fullTime: formattedTime,
    });
  } catch (error) {
    ctx.logger.error('Endfield stamina error:', error);
    return session.text('endfield.networkError');
  }
}
