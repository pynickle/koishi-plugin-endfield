import { Config } from '../../config/config';
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

    try {
      await ctx.database.upsert(
        'endfield_char_pools',
        charPools.map((charPool) => {
          return {
            pool_id: charPool.pool_id,
            name: charPool.name,
            chars: charPool.chars,
            pool_start_at_ts: charPool.pool_start_at_ts,
            pool_end_at_ts: charPool.pool_end_at_ts,
            start_at_ts: charPool.start_at_ts,
            end_at_ts: charPool.end_at_ts,
            sort_id: charPool.sort_id,
          };
        })
      );
    } catch (error) {
      ctx.logger.error(`Failed to save char pool:`, error);
    }

    ctx.logger.info(`Successfully fetched and saved ${charPools.length} char pools`);
  } catch (error) {
    ctx.logger.error('Error in fetchAndSaveCharPools:', error);
  }
}
