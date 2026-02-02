import zhCN from './locales/zh-CN.json';
import { Schema } from 'koishi';

export interface Config {
  apiKey: string;
  apiBaseUrl: string;
  clientUrl: string;
}

export const Config: Schema<Config> = Schema.object({
  apiKey: Schema.string().required(),
  apiBaseUrl: Schema.string().default('https://end-api.shallow.ink/'),
  clientUrl: Schema.string().default('https://end.shallow.ink/'),
}).i18n({
  'zh-CN': zhCN,
});
