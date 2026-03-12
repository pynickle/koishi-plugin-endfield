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
  CHECK_SUBSCRIPTIONS: '*/2 * * * *',
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

export const CONSTANT_WEAPONS: string[] = [
  '艺术暴君',
  '黯色火炬',
  '领航者',
  '作品：蚀迹',
  '骑士精神',
  '遗忘',
  '爆破单元',
  '沧溟星梦',
  '同类相食',
  '楔子',
  'J.E.T.',
  '骁勇',
  '负山',
  '破碎君王',
  '昔日精品',
  '典范',
  '赫拉芬格',
  '大雷斑',
  '白夜新星',
  '显赫声名',
  '热熔切割器',
  '扶摇',
  '不知归',
  '宏愿',
] as const;

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
