import { Config } from '../../config/config';
import { getDominantColor } from '../../utils/color-utils';
import axios from 'axios';
import { Context } from 'koishi';

export async function fetchAndSaveCharPools(ctx: Context, cfg: Config): Promise<void> {
  try {
    const charPoolsUrl = new URL('/api/wiki/char-pools', cfg.apiBaseUrl);
    const charPoolsResponse = await axios.get(charPoolsUrl.toString(), {
      headers: {
        'X-API-KEY': cfg.apiKey,
      },
    });

    const charPoolsData = charPoolsResponse.data;

    if (charPoolsData.code !== 0) {
      ctx.logger.error('Failed to fetch char pools:', charPoolsData.message);
      return;
    }

    const charPools: CharPool[] = charPoolsData.data.pools;
    const existingPools = await ctx.database.get('endfield_char_pools_v2', {});
    const existingPoolByName = new Map(existingPools.map((pool) => [pool.name, pool]));

    try {
      const processedPools = await Promise.all(
        charPools.map(async (charPool) => {
          let dominantColor: string | null = null;

          if (charPool.chars[0]?.pic) {
            dominantColor = await getDominantColor(ctx, charPool.chars[0].pic);
          }

          const existingPool = existingPoolByName.get(charPool.name);
          const mergedData = {
            pool_id: existingPool?.pool_id ?? charPool.pool_id,
            name: charPool.name,
            chars: charPool.chars,
            pool_start_at_ts: charPool.pool_start_at_ts,
            pool_end_at_ts: charPool.pool_end_at_ts,
            start_at_ts: charPool.start_at_ts,
            end_at_ts: charPool.end_at_ts,
            sort_id: charPool.sort_id,
            dominant_color: dominantColor,
          };

          if (existingPool && !existingPool.id) {
            await ctx.database.set(
              'endfield_char_pools_v2',
              { name: existingPool.name, pool_id: existingPool.pool_id },
              mergedData
            );
            return null;
          }

          return {
            id: existingPool?.id ?? charPool.pool_id,
            ...mergedData,
          };
        })
      );

      const upsertPools = processedPools.filter((pool): pool is NonNullable<typeof pool> => !!pool);
      if (upsertPools.length > 0) {
        await ctx.database.upsert('endfield_char_pools_v2', upsertPools);
      }
    } catch (error) {
      ctx.logger.error(`Failed to save char pool:`, error);
    }

    ctx.logger.info(`Successfully fetched and saved ${charPools.length} char pools`);
  } catch (error) {
    ctx.logger.error('Error in fetchAndSaveCharPools:', error);
  }
}
