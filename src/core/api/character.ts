import { ApiClient } from './client';

export interface Character {
  id: string;
  name: string;
}

export interface CharacterNote {
  chars: Character[];
}

export interface CharacterCard {
  detail: any;
}

export class CharacterApi {
  constructor(private client: ApiClient) {}

  async getNote(frameworkToken: string): Promise<CharacterNote> {
    const response = await this.client.get<CharacterNote>(
      '/api/endfield/note',
      undefined,
      frameworkToken
    );
    return response.data;
  }

  async getCard(instId: string, frameworkToken: string): Promise<CharacterCard> {
    const response = await this.client.get<CharacterCard>(
      '/api/endfield/card/char',
      { instId },
      frameworkToken
    );
    return response.data;
  }
}
