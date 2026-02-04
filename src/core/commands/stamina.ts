import { Config } from '../../config/config';
import axios from 'axios';
import { Context, Session } from 'koishi';

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
    const fullTime = new Date(maxTs * 1000);
    const formattedTime = `${fullTime.getFullYear()}-${String(fullTime.getMonth() + 1).padStart(2, '0')}-${String(fullTime.getDate()).padStart(2, '0')} ${String(fullTime.getHours()).padStart(2, '0')}:${String(fullTime.getMinutes()).padStart(2, '0')}`;

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
