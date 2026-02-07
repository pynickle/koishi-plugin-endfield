export const AUTH_CONFIG = {
  CLIENT_ID: 'yuan-bot',
  CLIENT_NAME: 'Yuan Bot',
  CLIENT_TYPE: 'bot',
  SCOPES: ['user_info', 'binding_info'],
} as const;

export const POLLING_CONFIG = {
  AUTH_POLLING_INTERVAL: 3000,
  AUTH_MAX_ATTEMPTS: 75,
  GACHA_POLLING_INTERVAL: 2000,
  GACHA_MAX_ATTEMPTS: 300,
} as const;

export const CRON_SCHEDULES = {
  AUTO_SIGN: '1 0 * * *',
  FETCH_CHAR_POOLS: '0 */3 * * *',
  CHECK_SUBSCRIPTIONS: '* * * * *',
  CHECK_ANNOUNCEMENTS: '*/3 * * * *',
} as const;

export const DATABASE_IDS = {
  ANNOUNCEMENTS_SERVICE: 'endfield_announcements_service',
} as const;

export const CONSTANT_WEAPON_MAP: Record<string, string> = {
  weaponbox_constant_1: '赫拉芬格',
  weaponbox_constant_2: '沧溟星梦',
  weaponbox_constant_3: '不知归',
  weaponbox_constant_4: '负山',
  weaponbox_constant_5: '大雷斑',
} as const;

export const POOL_TYPES = {
  SPECIAL: 'special',
  WEAPON: 'weapon',
  STANDARD: 'standard',
  BEGINNER: 'beginner',
} as const;

export const RARITY = {
  SIX_STAR: 6,
  FIVE_STAR: 5,
} as const;

export const AUTH_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  USED: 'used',
} as const;

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
