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

interface GachaRecordsResponse {
  code: number;
  message: string;
  data: {
    records: any[];
    pages: number;
    [key: string]: any;
  };
}

async function fetchAllGachaRecords(
  ctx: Context,
  cfg: Config,
  frameworkToken: string
): Promise<any> {
  let allRecords: any[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const recordsUrl = new URL('/api/endfield/gacha/records', cfg.apiBaseUrl);
    recordsUrl.searchParams.set('page', currentPage.toString());

    const recordsResponse = await axios.get<GachaRecordsResponse>(recordsUrl.toString(), {
      headers: {
        'X-Framework-Token': frameworkToken,
        'X-API-KEY': cfg.apiKey,
      },
    });

    const recordsData = recordsResponse.data;

    if (recordsData.code !== 0) {
      throw new Error(recordsData.message);
    }

    allRecords = [...allRecords, ...recordsData.data.records];
    totalPages = recordsData.data.pages;
    currentPage++;
  } while (currentPage <= totalPages);

  return {
    ...(
      await axios.get<GachaRecordsResponse>(
        new URL('/api/endfield/gacha/records', cfg.apiBaseUrl).toString(),
        {
          headers: {
            'X-Framework-Token': frameworkToken,
            'X-API-KEY': cfg.apiKey,
          },
        }
      )
    ).data.data,
    records: allRecords,
  };
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

    const charPools = await ctx.database.get('endfield_char_pools_v2', {});

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
      const maxAttempts = 300;

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

                try {
                  const allRecordsData = await fetchAllGachaRecords(ctx, cfg, frameworkToken);
                  resolve(await renderGachaRecord(ctx, cfg, allRecordsData, charPools));
                } catch (error) {
                  resolve(
                    session.text('.recordsError', {
                      message: error instanceof Error ? error.message : 'Unknown error',
                    })
                  );
                }
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
      try {
        const allRecordsData = await fetchAllGachaRecords(ctx, cfg, frameworkToken);
        return await renderGachaRecord(ctx, cfg, allRecordsData, charPools);
      } catch (error) {
        return session.text('.recordsError', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    ctx.logger.error('Endfield gacha error:', error);
    return session.text('endfield.networkError');
  }
}
