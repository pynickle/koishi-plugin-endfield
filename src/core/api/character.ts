import { ApiClient } from './client';

export interface Character {
  id: string;
  name: string;
}

export interface CharacterNote {
  chars: Character[];
}

export interface CharacterNoteBase {
  avatarUrl: string;
  charNum: number;
  createTime: string;
  docNum: number;
  exp: number;
  lastLoginTime: string;
  level: number;
  mainMission: {
    description: string;
    id: string;
  };
  name: string;
  roleId: string;
  serverName: string;
  weaponNum: number;
  worldLevel: number;
}

export interface CharacterNoteChar {
  avatarRtUrl: string;
  avatarSqUrl: string;
  id: string;
  level: number;
  name: string;
  profession: {
    key: string;
    value: string;
  };
  rarity: {
    key: string;
    value: string;
  };
}

export interface CharacterNoteDetail extends CharacterNote {
  base: CharacterNoteBase;
  bpSystem?: {
    curLevel: number;
    maxLevel: number;
  };
  charCount: number;
  chars: CharacterNoteChar[];
  dailyMission?: {
    activation: number;
    maxActivation: number;
  };
  stamina?: {
    current: string;
    max: string;
    maxTs: string;
  };
}

export interface CharacterCard {
  detail: any;
}

export class CharacterApi {
  constructor(private client: ApiClient) {}

  async getNote(frameworkToken: string): Promise<CharacterNoteDetail> {
    const response = await this.client.get<CharacterNoteDetail>(
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
