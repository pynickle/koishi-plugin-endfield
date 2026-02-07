export interface CharPool {
  id: string;
  pool_id: string;
  name: string;
  chars: Array<{
    char_id: string;
    name: string;
    cover: string;
    rarity: string;
  }>;
  pool_start_at_ts: string;
  pool_end_at_ts: string;
  start_at_ts: string;
  end_at_ts: string;
  sort_id: number;
  dominant_color: string;
}

export interface Binding {
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
}

export interface Subscription {
  user_id: string;
  group_id: string;
  time: string;
  created_at: string;
  updated_at: string;
}

export interface StaminaSubscription {
  user_id: string;
  group_id: string;
  duration: string;
  reminder_interval: string;
  created_at: string;
  updated_at: string;
  last_reminded_at: string;
}

export interface AnnouncementRecord {
  id: string;
  last_announcement_id: string;
  updated_at: string;
}

export interface WeaponPool {
  pool_id: string;
  pool_name: string;
  up_weapons: Array<{
    char_id: string;
    name: string;
    cover: string;
    rarity: number;
    is_up: boolean;
  }>;
}

export interface SignResult {
  success: boolean;
  message: string;
  awards?: string;
}

export interface AutoSignStats {
  total: number;
  success: number;
  failed: number;
  failedUsers: Array<{ userId: string; message: string }>;
}
