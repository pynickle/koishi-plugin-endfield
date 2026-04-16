import { Context } from 'koishi';

import { Config } from './config/config';
import { registerCommands } from './core/commands';
import { extendDatabase } from './core/database';

import '@pynickle/koishi-plugin-adapter-onebot';
import 'koishi-plugin-cron';
import { registerCronJobs, initializeServices } from './core/scheduler';
import zhCN from './locales/zh-CN.json';

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
      };
      binding_info: {
        role_id: string;
        server_id: string;
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
    endfield_subscriptions: {
      user_id: string;
      group_id: string;
      time: string;
      created_at: string;
      updated_at: string;
    };
    endfield_stamina_subscriptions: {
      user_id: string;
      group_id: string;
      duration: string;
      reminder_interval: string;
      created_at: string;
      updated_at: string;
      last_reminded_at: string;
    };
    endfield_announcements: {
      id: string;
      last_announcement_id: string;
      updated_at: string;
    };
  }
}

export async function apply(ctx: Context, cfg: Config) {
  ctx.i18n.define('zh-CN', zhCN);

  extendDatabase(ctx);
  registerCommands(ctx, cfg);
  registerCronJobs(ctx, cfg);

  await initializeServices(ctx, cfg);
}
