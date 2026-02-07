import { ApiClient } from './client';

export interface AuthRequestData {
  client_id: string;
  client_name: string;
  client_type: string;
  scopes: readonly string[];
}

export interface AuthRequestResponse {
  request_id: string;
  auth_url: string;
  expires_at: string;
}

export interface AuthStatusResponse {
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'used';
  framework_token?: string;
  user_info?: {
    nickname: string;
  };
  binding_info?: {
    role_id: string;
    server_id: string;
    nickname: string;
    level: number;
  };
}

export class AuthApi {
  constructor(private client: ApiClient) {}

  async createRequest(data: AuthRequestData): Promise<AuthRequestResponse> {
    const response = await this.client.post<AuthRequestResponse>(
      '/api/v1/authorization/requests',
      data
    );
    return response.data;
  }

  async getStatus(requestId: string): Promise<AuthStatusResponse> {
    const response = await this.client.get<AuthStatusResponse>(
      `/api/v1/authorization/requests/${requestId}/status`
    );
    return response.data;
  }
}
