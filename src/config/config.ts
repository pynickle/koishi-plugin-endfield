import { Schema } from 'koishi';

import zhCN from './locales/zh-CN.json';

export interface Config {
  apiKey: string;
  apiBaseUrl: string;
  clientUrl: string;
  adminUserId: string;
  adminPlatform?: string;
  adminBotSelfId?: string;
  enableStaminaSubscriptions: boolean;
  announcementTargets: Array<{
    channelId: string;
    platform?: string;
    selfId?: string;
  }>;
  noteAvatarStyle: 'rt' | 'sq';
  enableEndfieldPanelApi: boolean;
  endfieldPanelApiUrl: string;
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().required(),
  apiBaseUrl: Schema.string().default('https://end-api.shallow.ink/'),
  clientUrl: Schema.string().default('https://end.shallow.ink/'),
  adminUserId: Schema.string().default(''),
  adminPlatform: Schema.string().default(''),
  adminBotSelfId: Schema.string().default(''),
  enableStaminaSubscriptions: Schema.boolean().default(false),
  announcementTargets: Schema.array(
    Schema.object({
      channelId: Schema.string().required(),
      platform: Schema.string().default(''),
      selfId: Schema.string().default(''),
    })
  ).default([]),
  noteAvatarStyle: Schema.union(['rt', 'sq']).default('rt'),
  enableEndfieldPanelApi: Schema.boolean().default(false),
  endfieldPanelApiUrl: Schema.string().default(''),
}).i18n({
  'zh-CN': zhCN,
});
