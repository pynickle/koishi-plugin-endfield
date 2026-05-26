import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { POLLING_CONFIG, SYNC_STATUS } from '../../constants';
import { GachaApi, createApiClient, type GachaSyncStatus } from '../api';
import { logPluginError } from '../errors';
import { sendReplyImage, sendSessionMessage, tryDeleteMessage } from '../messaging';
import { renderGachaRecord } from '../render/gacha';

async function fetchAllGachaRecords(
  ctx: Context,
  cfg: Config,
  frameworkToken: string
): Promise<any> {
  const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
  const gachaApi = new GachaApi(api);

  let allRecords: any[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const recordsData = await gachaApi.getRecords(currentPage, frameworkToken);

    allRecords = [...allRecords, ...recordsData.records];
    totalPages = recordsData.pages;
    currentPage++;
  } while (currentPage <= totalPages);

  const firstPageData = await gachaApi.getRecords(1, frameworkToken);

  return {
    ...firstPageData,
    records: allRecords,
  };
}

async function syncGachaRecords(
  ctx: Context,
  session: Session,
  cfg: Config,
  frameworkToken: string,
  charPools: any[],
  syncMsgId?: string | number
): Promise<string | void> {
  const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
  const gachaApi = new GachaApi(api);

  await gachaApi.fetchRecords(frameworkToken);

  let pollingInterval: string | number | NodeJS.Timeout;
  let pollingAttempts = 0;

  return new Promise<string | void>((resolve) => {
    pollingInterval = setInterval(async () => {
      pollingAttempts++;

      if (pollingAttempts > POLLING_CONFIG.GACHA_MAX_ATTEMPTS) {
        clearInterval(pollingInterval);

        await tryDeleteMessage(ctx, session, syncMsgId, {
          command: 'endfield.gacha',
          phase: 'sync-timeout',
        });
        resolve(session.text('.syncTimeout'));
        return;
      }

      try {
        const syncStatus: GachaSyncStatus = await gachaApi.getSyncStatus(frameworkToken);

        if (syncStatus.status === SYNC_STATUS.COMPLETED) {
          clearInterval(pollingInterval);

          ctx.logger.info('Gacha sync completed:', syncStatus.status);

          await tryDeleteMessage(ctx, session, syncMsgId, {
            command: 'endfield.gacha',
            phase: 'sync-completed',
          });

          try {
            const allRecordsData = await fetchAllGachaRecords(ctx, cfg, frameworkToken);
            const image = await renderGachaRecord(ctx, cfg, allRecordsData, charPools);

            if (
              await sendReplyImage(ctx, session, image, undefined, {
                command: 'endfield.gacha',
                phase: 'sync-completed',
              })
            ) {
              resolve();
              return;
            }

            resolve(image);
          } catch (error) {
            logPluginError(ctx, 'endfield.gacha failed while rendering synced records', error, {
              phase: 'sync-completed',
              userId: session.userId,
            });
            resolve(
              session.text('.recordsError', {
                message: error instanceof Error ? error.message : 'Unknown error',
              })
            );
          }
        } else if (syncStatus.status === SYNC_STATUS.FAILED) {
          clearInterval(pollingInterval);

          await tryDeleteMessage(ctx, session, syncMsgId, {
            command: 'endfield.gacha',
            phase: 'sync-failed',
          });

          resolve(
            session.text('.syncFailed', {
              message: syncStatus.error,
            })
          );
        }
      } catch (error) {
        logPluginError(ctx, 'endfield.gacha polling failed', error, {
          userId: session.userId,
        });
      }
    }, POLLING_CONFIG.GACHA_POLLING_INTERVAL);
  });
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
      const syncText = session.text('.syncing');
      const syncMsgId = await sendSessionMessage(session, syncText);

      return await syncGachaRecords(ctx, session, cfg, frameworkToken, charPools, syncMsgId);
    } else {
      try {
        const allRecordsData = await fetchAllGachaRecords(ctx, cfg, frameworkToken);

        if (allRecordsData.records.length === 0) {
          const noRecordsText = session.text('.noRecordsFound');
          const noRecordsMsgId = await sendSessionMessage(session, noRecordsText);

          const syncText = session.text('.syncing');
          const syncMsgId = await sendSessionMessage(session, syncText);

          const result = await syncGachaRecords(
            ctx,
            session,
            cfg,
            frameworkToken,
            charPools,
            syncMsgId
          );

          await tryDeleteMessage(ctx, session, noRecordsMsgId, {
            command: 'endfield.gacha',
            phase: 'no-records-fallback',
          });

          return result;
        }

        const image = await renderGachaRecord(ctx, cfg, allRecordsData, charPools);

        if (
          await sendReplyImage(ctx, session, image, undefined, {
            command: 'endfield.gacha',
            phase: options.noSync ? 'no-sync' : 'direct',
          })
        ) {
          return;
        }

        return image;
      } catch (error) {
        logPluginError(ctx, 'endfield.gacha failed while fetching local records', error, {
          userId: session.userId,
          noSync: true,
        });
        return session.text('.recordsError', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    logPluginError(ctx, 'endfield.gacha failed', error, {
      userId: session.userId,
      noSync: !!options.noSync,
    });
    return session.text('endfield.networkError');
  }
}
