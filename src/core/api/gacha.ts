import { ApiClient } from './client';

export interface GachaRecord {
  char_id: string;
  char_name: string;
  rarity: number;
  gacha_ts: string;
  pool_id: string;
  pool_name: string;
  is_new: boolean;
  is_free: boolean;
  seq_id: string;
}

export interface GachaRecordsResponse {
  records: GachaRecord[];
  pages: number;
  user_info: {
    nickname: string;
    game_uid: string;
    channel_name: string;
  };
}

export interface GachaFetchResponse {
  task_id: string;
}

export interface GachaSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  message: string;
  current_pool?: string;
  total_pools?: number;
  completed_pools?: number;
  records_found?: number;
  new_records?: number;
  started_at?: string;
  updated_at?: string;
  elapsed_seconds?: number;
  error?: string;
}

export interface PoolCharacter {
  char_id: string;
  name: string;
  cover: string;
  rarity: number;
  is_up: boolean;
}

export interface GachaPoolData {
  pool_name: string;
  star6_chars: PoolCharacter[];
}

export interface GachaPoolResponse {
  pools: GachaPoolData[];
}

export class GachaApi {
  constructor(private client: ApiClient) {}

  async getRecords(page: number = 1, frameworkToken: string): Promise<GachaRecordsResponse> {
    const response = await this.client.get<GachaRecordsResponse>(
      '/api/endfield/gacha/records',
      { page },
      frameworkToken
    );
    return response.data;
  }

  async fetchRecords(frameworkToken: string): Promise<GachaFetchResponse> {
    const response = await this.client.post<GachaFetchResponse>(
      '/api/endfield/gacha/fetch',
      {},
      frameworkToken
    );
    return response.data;
  }

  async getSyncStatus(frameworkToken: string): Promise<GachaSyncStatus> {
    const response = await this.client.get<GachaSyncStatus>(
      '/api/endfield/gacha/sync/status',
      undefined,
      frameworkToken
    );
    return response.data;
  }

  async getPoolChars(poolId: string): Promise<GachaPoolResponse> {
    const response = await this.client.get<GachaPoolResponse>('/api/endfield/gacha/pool-chars', {
      pool_id: poolId,
    });
    return response.data;
  }
}
