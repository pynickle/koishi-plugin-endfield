import { ApiClient } from './client';

export interface StaminaResponse {
  dailyMission: {
    activation: number;
    maxActivation: number;
  };
  stamina: {
    maxTs: string;
  };
}

export class StaminaApi {
  constructor(private client: ApiClient) {}

  async getStamina(frameworkToken: string): Promise<StaminaResponse> {
    const response = await this.client.get<StaminaResponse>(
      '/api/endfield/stamina',
      undefined,
      frameworkToken
    );
    return response.data;
  }
}
