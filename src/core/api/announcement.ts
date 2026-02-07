import { ApiClient } from './client';

export interface Announcement {
  id: string;
  item_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface AnnouncementListResponse {
  list: Announcement[];
}

export class AnnouncementApi {
  constructor(private client: ApiClient) {}

  async getLatest(): Promise<Announcement> {
    const response = await this.client.get<Announcement>('/api/announcements/latest');
    return response.data;
  }

  async getList(): Promise<Announcement[]> {
    const response = await this.client.get<AnnouncementListResponse>('/api/announcements');
    return response.data.list;
  }
}
