import { Schema } from 'koishi';

import zhCN from './locales/zh-CN.json';

export interface Config {
  apiKey: string;
  apiBaseUrl: string;
  clientUrl: string;
  adminQQ: string;
  enableStaminaSubscriptions: boolean;
  announcementGroups: string[];
  noteAvatarStyle: 'rt' | 'sq';
  enableEndfieldPanelApi: boolean;
  endfieldPanelApiUrl: string;
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().required(),
  apiBaseUrl: Schema.string().default('https://end-api.shallow.ink/'),
  clientUrl: Schema.string().default('https://end.shallow.ink/'),
  adminQQ: Schema.string().required(),
  enableStaminaSubscriptions: Schema.boolean().default(false),
  announcementGroups: Schema.array(Schema.string()).default([]),
  noteAvatarStyle: Schema.union(['rt', 'sq']).default('rt'),
  enableEndfieldPanelApi: Schema.boolean().default(false),
  endfieldPanelApiUrl: Schema.string().default(''),
}).i18n({
  'zh-CN': zhCN,
});
