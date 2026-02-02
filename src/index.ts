import { Config } from './config/config';
import { endfieldAuth } from './core/commands/auth';
import { endfieldSign } from './core/commands/sign';
import { setupAutoSign } from './core/services/cron';
import '@pynickle/koishi-plugin-adapter-onebot';
import 'koishi-plugin-cron';
import zhCN from './locales/zh-CN.json';
import { Context } from 'koishi';

export const name = 'endfield';

export const inject = ['database', 'puppeteer', 'cron'];

export * from './config/config';

declare module 'koishi' {
  interface Tables {
    endfield_bindings: {
      id: number;
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
    endfield_bindings_v2: {
      id: number;
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
  }
}

export function apply(ctx: Context, cfg: Config) {
  ctx.i18n.define('zh-CN', zhCN);

  ctx.database.extend(
    'endfield_bindings',
    {
      id: 'unsigned',
      user_id: 'string',
      framework_token: 'string',
      user_info: 'json',
      binding_info: 'json',
      expires_at: 'timestamp',
    },
    {
      primary: 'id',
      unique: ['user_id'],
      autoInc: true,
    }
  );

  ctx.database.extend(
    'endfield_bindings_v2',
    {
      id: 'unsigned',
      user_id: 'string',
      framework_token: 'string',
      user_info: 'json',
      binding_info: 'json',
      expires_at: 'timestamp',
    },
    {
      primary: 'id',
      unique: ['user_id'],
      autoInc: true,
    }
  );

  ctx.model.migrate(
    'endfield_bindings',
    {
      id: 'unsigned',
    },
    async (database) => {
      const data = await database.get('endfield_bindings', {});
      await database.upsert('endfield_bindings_v2', data);
    }
  );

  ctx.command('endfield.auth').action(async ({ session }) => endfieldAuth(ctx, session, cfg));
  ctx.command('endfield.sign').action(async ({ session }) => endfieldSign(ctx, session, cfg));

  // Setup auto sign task
  setupAutoSign(ctx, cfg);
}
