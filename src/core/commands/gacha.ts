import { Config } from '../../config/config';
import { POLLING_CONFIG, SYNC_STATUS } from '../../constants';
import { GachaApi, createApiClient, type GachaSyncStatus } from '../api';
import { renderGachaRecord } from '../render/gacha';
import { Context, Session } from 'koishi';

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
  syncMsgId: string | number
): Promise<string> {
  const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
  const gachaApi = new GachaApi(api);

  await gachaApi.fetchRecords(frameworkToken);

  let pollingInterval: string | number | NodeJS.Timeout;
  let pollingAttempts = 0;

  return new Promise<string>((resolve) => {
    pollingInterval = setInterval(async () => {
      pollingAttempts++;

      if (pollingAttempts > POLLING_CONFIG.GACHA_MAX_ATTEMPTS) {
        clearInterval(pollingInterval);

        if (session.onebot) {
          await session.onebot.deleteMsg(syncMsgId);
        }
        resolve(session.text('.syncTimeout'));
        return;
      }

      try {
        const syncStatus: GachaSyncStatus = await gachaApi.getSyncStatus(frameworkToken);

        if (syncStatus.status === SYNC_STATUS.COMPLETED) {
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
        } else if (syncStatus.status === SYNC_STATUS.FAILED) {
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
      } catch (error) {
        ctx.logger.error('Polling gacha sync status error:', error);
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
      let syncMsgId: string | number;
      const syncText = session.text('.syncing');

      if (session.onebot) {
        syncMsgId = await session.onebot.sendGroupMsg(session.channelId, [
          { type: 'text', data: { text: syncText } },
        ]);
      } else {
        await session.send(syncText);
      }

      return await syncGachaRecords(ctx, session, cfg, frameworkToken, charPools, syncMsgId);
    } else {
      try {
        const allRecordsData = await fetchAllGachaRecords(ctx, cfg, frameworkToken);

        if (allRecordsData.records.length === 0) {
          let noRecordsMsgId: string | number;
          const noRecordsText = session.text('.noRecordsFound');

          if (session.onebot) {
            noRecordsMsgId = await session.onebot.sendGroupMsg(session.channelId, [
              { type: 'text', data: { text: noRecordsText } },
            ]);
          } else {
            await session.send(noRecordsText);
          }

          let syncMsgId: string | number;
          const syncText = session.text('.syncing');

          if (session.onebot) {
            syncMsgId = await session.onebot.sendGroupMsg(session.channelId, [
              { type: 'text', data: { text: syncText } },
            ]);
          } else {
            await session.send(syncText);
          }

          const result = await syncGachaRecords(
            ctx,
            session,
            cfg,
            frameworkToken,
            charPools,
            syncMsgId
          );

          if (session.onebot) {
            await session.onebot.deleteMsg(noRecordsMsgId);
          }

          return result;
        }

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
