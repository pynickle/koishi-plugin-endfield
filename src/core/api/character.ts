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

export interface FriendDetail {
  deleted_role_ids: string[];
  query: {
    role_id: number;
  };
  role_profile: {
    adventure_level: number;
    char_data: Array<{
      level: number;
      potential_level: number;
      template: {
        id: string;
        name: string;
        name_cn: string;
        raw_name: string;
      };
      template_id: string;
    }>;
    name: string;
    role_id: number;
    short_id: string;
  };
}

export interface DetailedCharacterCard {
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

  async getFriendDetail(frameworkToken: string): Promise<FriendDetail> {
    const response = await this.client.get<FriendDetail>(
      '/api/friend/detail',
      undefined,
      frameworkToken
    );
    return response.data;
  }

  async getDetailedCharacterCard(
    roleId: number,
    templateId: string,
    frameworkToken: string
  ): Promise<DetailedCharacterCard> {
    const response = await this.client.get<DetailedCharacterCard>(
      '/api/friend/char',
      { role_id: roleId, template_id: templateId },
      frameworkToken
    );
    return response.data;
  }
}
