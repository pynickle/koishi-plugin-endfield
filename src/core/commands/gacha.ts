import { Config } from '../../config/config';
import { renderGachaRecord } from '../render/gacha';
import axios from 'axios';
import { Context, Session } from 'koishi';

interface GachaSyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  stage: string;
  progress: number;
  message: string;
  current_pool?: string;
  total_pools?: number;
  completed_pools?: number;
  records_found?: number;
  new_records?: number;
  started_at?: string;
  updated_at?: string;
  elapsed_seconds?: number;
  error?: string;
}

export async function endfieldGacha(
  ctx: Context,
  session: Session,
  cfg: Config,
  options: { noSync?: boolean } = {}
) {
  try {
    const bindings = await ctx.database.get('endfield_bindings_v3', session.userId);

    if (bindings.length === 0) {
      return session.text('endfield.notBoundError');
    }

    const binding = bindings[0];
    const frameworkToken = binding.framework_token;

    const charPools = await ctx.database.get('endfield_char_pools', {});

    if (!options.noSync) {
      let syncMsgId: string | number;
      const syncText = session.text('.syncing');

      if (session.onebot) {
        syncMsgId = await session.onebot.sendGroupMsg(session.channelId, [
          { type: 'text', data: { text: syncText } },
        ]);
      } else {
        await session.send(syncText);
      }

      const fetchUrl = new URL('/api/endfield/gacha/fetch', cfg.apiBaseUrl);
      const fetchResponse = await axios.post(
        fetchUrl.toString(),
        {},
        {
          headers: {
            'X-Framework-Token': frameworkToken,
            'X-API-KEY': cfg.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      const fetchData = fetchResponse.data;

      if (fetchData.code !== 0) {
        if (session.onebot) {
          await session.onebot.deleteMsg(syncMsgId);
        }
        return session.text('.syncTaskError', {
          message: fetchData.message,
        });
      }

      let pollingInterval: string | number | NodeJS.Timeout;
      let pollingAttempts = 0;
      const maxAttempts = 300; // 最多轮询 5 分钟

      return new Promise<string>((resolve) => {
        pollingInterval = setInterval(async () => {
          pollingAttempts++;

          if (pollingAttempts > maxAttempts) {
            clearInterval(pollingInterval);

            if (session.onebot) {
              await session.onebot.deleteMsg(syncMsgId);
            }
            resolve(session.text('.syncTimeout'));
            return;
          }

          try {
            const statusUrl = new URL('/api/endfield/gacha/sync/status', cfg.apiBaseUrl);
            const statusResponse = await axios.get(statusUrl.toString(), {
              headers: {
                'X-Framework-Token': frameworkToken,
                'X-API-KEY': cfg.apiKey,
              },
            });

            const statusData = statusResponse.data;

            if (statusData.code === 0) {
              const syncStatus: GachaSyncStatus = statusData.data;

              if (syncStatus.status === 'completed') {
                clearInterval(pollingInterval);

                ctx.logger.info('Gacha sync completed:', syncStatus.status);

                if (session.onebot) {
                  await session.onebot.deleteMsg(syncMsgId);
                }

                const recordsUrl = new URL('/api/endfield/gacha/records', cfg.apiBaseUrl);
                const recordsResponse = await axios.get(recordsUrl.toString(), {
                  headers: {
                    'X-Framework-Token': frameworkToken,
                    'X-API-KEY': cfg.apiKey,
                  },
                });

                const recordsData = recordsResponse.data;

                if (recordsData.code !== 0) {
                  resolve(
                    session.text('.recordsError', {
                      message: recordsData.message,
                    })
                  );
                  return;
                }

                return await renderGachaRecord(ctx, recordsData.data, charPools);
              } else if (syncStatus.status === 'failed') {
                clearInterval(pollingInterval);

                if (session.onebot) {
                  await session.onebot.deleteMsg(syncMsgId);
                }

                resolve(
                  session.text('.syncFailed', {
                    message: syncStatus.error,
                  })
                );
              }
            }
          } catch (error) {
            ctx.logger.error('Polling gacha sync status error:', error);
          }
        }, 2000);
      });
    } else {
      const recordsUrl = new URL('/api/endfield/gacha/records', cfg.apiBaseUrl);
      const recordsResponse = await axios.get(recordsUrl.toString(), {
        headers: {
          'X-Framework-Token': frameworkToken,
          'X-API-KEY': cfg.apiKey,
        },
      });

      const recordsData = recordsResponse.data;

      if (recordsData.code !== 0) {
        return session.text('.recordsError', {
          message: recordsData.message,
        });
      }

      return await renderGachaRecord(ctx, recordsData.data, charPools);
    }
  } catch (error) {
    ctx.logger.error('Endfield gacha error:', error);
    return session.text('endfield.networkError');
  }
}
