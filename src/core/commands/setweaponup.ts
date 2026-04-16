import axios from 'axios';
import { Context, Session } from 'koishi';

import { Config } from '../../config/config';

export async function endfieldSetWeaponUp(
  ctx: Context,
  session: Session,
  cfg: Config,
  poolId: string,
  weaponName: string
) {
  try {
    // Step 1: Fetch weapon pool info from API
    const weaponPoolUrl = new URL('/api/endfield/gacha/pool-chars', cfg.apiBaseUrl);
    const weaponPoolResponse = await axios.get(weaponPoolUrl.toString(), {
      params: {
        pool_id: poolId,
      },
      headers: {
        'X-API-KEY': cfg.apiKey,
      },
    });

    if (weaponPoolResponse.data.code !== 0) {
      return session.text('commands.endfield.setweaponup.messages.apiError', {
        message: weaponPoolResponse.data.message,
      });
    }

    const weaponPoolData = weaponPoolResponse.data.data.pools[0];
    if (!weaponPoolData) {
      return session.text('commands.endfield.setweaponup.messages.poolNotFound', {
        poolId,
      });
    }

    // Step 2: Find the weapon with the given name
    const weaponInfo = weaponPoolData.star6_chars.find((char: any) => char.name === weaponName);
    if (!weaponInfo) {
      return session.text('commands.endfield.setweaponup.messages.weaponNotFound', {
        weaponName,
        poolId,
      });
    }

    // Step 3: Save to database
    const weaponPoolRecord = {
      pool_id: poolId,
      pool_name: weaponPoolData.pool_name as string,
      up_weapons: [weaponInfo] as Array<{
        char_id: string;
        name: string;
        cover: string;
        rarity: number;
        is_up: boolean;
      }>,
    };

    await ctx.database.upsert('endfield_weapon_pools', [weaponPoolRecord]);

    return session.text('commands.endfield.setweaponup.messages.success', {
      weaponName,
      poolId,
      poolName: weaponPoolData.pool_name,
    });
  } catch (error) {
    ctx.logger.error('Error setting weapon up:', error);
    return session.text('commands.endfield.setweaponup.messages.error', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
