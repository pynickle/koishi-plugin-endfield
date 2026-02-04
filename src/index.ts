import { Config } from './config/config';
import { endfieldAuth } from './core/commands/auth';
import { endfieldChar } from './core/commands/char';
import { endfieldGacha } from './core/commands/gacha';
import { endfieldSign } from './core/commands/sign';
import '@pynickle/koishi-plugin-adapter-onebot';
import 'koishi-plugin-cron';
import { fetchAndSaveCharPools } from './core/services/char-pools';
import { autoSignAll } from './core/services/sign';
import zhCN from './locales/zh-CN.json';
import { Context } from 'koishi';

export const name = 'endfield';

export const inject = ['database', 'puppeteer', 'cron'];

export * from './config/config';

declare module 'koishi' {
  interface Tables {
    endfield_bindings_v3: {
      user_id: string;
      framework_token: string;
      user_info: {
        nickname: string;
        avatar: string;
      };
      binding_info: {
        role_id: string;
        nickname: string;
        level: number;
      };
      expires_at: Date;
    };
    endfield_char_pools_v2: CharPool;
    endfield_weapon_pools: {
      pool_id: string;
      pool_name: string;
      up_weapons: Array<{
        char_id: string;
        name: string;
        cover: string;
        rarity: number;
        is_up: boolean;
      }>;
    };
  }
}

export async function apply(ctx: Context, cfg: Config) {
  ctx.i18n.define('zh-CN', zhCN);

  ctx.database.extend(
    'endfield_bindings_v3',
    {
      user_id: 'string',
      framework_token: 'string',
      user_info: 'json',
      binding_info: 'json',
      expires_at: 'timestamp',
    },
    {
      primary: 'user_id',
    }
  );

  ctx.database.extend(
    'endfield_char_pools_v2',
    {
      id: 'string',
      pool_id: 'string',
      name: 'string',
      chars: 'json',
      pool_start_at_ts: 'string',
      pool_end_at_ts: 'string',
      start_at_ts: 'string',
      end_at_ts: 'string',
      sort_id: 'integer',
      dominant_color: 'string',
    },
    {
      primary: 'id',
    }
  );

  ctx.database.extend(
    'endfield_weapon_pools',
    {
      pool_id: 'string',
      pool_name: 'string',
      up_weapons: 'json',
    },
    {
      primary: 'pool_id',
    }
  );

  ctx.command('endfield.auth').action(async ({ session }) => endfieldAuth(ctx, session, cfg));
  ctx.command('endfield.sign').action(async ({ session }) => endfieldSign(ctx, session, cfg));
  ctx
    .command('endfield.char <charName>')
    .action(async ({ session }, charName) => endfieldChar(ctx, session, cfg, charName));
  ctx
    .command('endfield.gacha')
    .option('noSync', '-n 不同步直接获取抽卡记录')
    .action(async ({ session, options }) => endfieldGacha(ctx, session, cfg, options));

  // Setup auto sign task, run at 00:01 every day
  ctx.cron('1 0 * * *', async () => {
    await autoSignAll(ctx, cfg);
  });

  // Setup char pools fetch cron job, run at 12:00 every day
  ctx.cron('0 12 * * *', async () => {
    await fetchAndSaveCharPools(ctx, cfg);
  });

  // Fetch char pools on plugin start
  await fetchAndSaveCharPools(ctx, cfg);
}
