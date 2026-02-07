import { ApiClient } from './client';

export interface SignResponse {
  already_signed: boolean;
  awardIds: Array<{
    id: string;
  }>;
  resourceInfoMap: Record<
    string,
    {
      name: string;
      count: number;
    }
  >;
}

export class SignApi {
  constructor(private client: ApiClient) {}

  async sign(frameworkToken: string): Promise<SignResponse> {
    const response = await this.client.post<SignResponse>(
      '/api/endfield/attendance',
      {},
      frameworkToken
    );
    return response.data;
  }
}
