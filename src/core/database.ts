import { Context } from 'koishi';

export function extendDatabase(ctx: Context) {
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

  ctx.database.extend(
    'endfield_subscriptions',
    {
      user_id: 'string',
      group_id: 'string',
      time: 'string',
      created_at: 'string',
      updated_at: 'string',
    },
    {
      primary: 'user_id',
    }
  );

  ctx.database.extend(
    'endfield_stamina_subscriptions',
    {
      user_id: 'string',
      group_id: 'string',
      duration: 'string',
      reminder_interval: 'string',
      created_at: 'string',
      updated_at: 'string',
      last_reminded_at: 'string',
    },
    {
      primary: 'user_id',
    }
  );

  ctx.database.extend(
    'endfield_announcements',
    {
      id: 'string',
      last_announcement_id: 'string',
      updated_at: 'string',
    },
    {
      primary: 'id',
    }
  );
}
