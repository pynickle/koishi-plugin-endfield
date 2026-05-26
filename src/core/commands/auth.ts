import dayjs from 'dayjs';
import { Context, Session } from 'koishi';

import { Config } from '../../config/config';
import { AUTH_CONFIG, POLLING_CONFIG, AUTH_STATUS } from '../../constants';
import { AuthApi, createApiClient } from '../api';
import { logPluginError } from '../errors';
import { sendSessionMessage, tryDeleteMessage } from '../messaging';

export async function endfieldAuth(ctx: Context, session: Session, cfg: Config) {
  try {
    const api = createApiClient({ apiKey: cfg.apiKey, apiBaseUrl: cfg.apiBaseUrl });
    const authApi = new AuthApi(api);

    const authRequest = await authApi.createRequest({
      client_id: AUTH_CONFIG.CLIENT_ID,
      client_name: AUTH_CONFIG.CLIENT_NAME,
      client_type: AUTH_CONFIG.CLIENT_TYPE,
      scopes: AUTH_CONFIG.SCOPES,
    });

    const { request_id, auth_url, expires_at } = authRequest;
    const fullAuthUrl = new URL(auth_url, cfg.clientUrl).toString();

    const authText = session.text('.authUrl', {
      url: fullAuthUrl,
      expiresAt: dayjs(expires_at).format('YYYY-MM-DD HH:mm:ss'),
    });

    const authUrlMsgId = await sendSessionMessage(session, authText);

    let pollingInterval: string | number | NodeJS.Timeout;
    let pollingAttempts = 0;

    return new Promise<string>((resolve) => {
      pollingInterval = setInterval(async () => {
        pollingAttempts++;

        if (pollingAttempts > POLLING_CONFIG.AUTH_MAX_ATTEMPTS) {
          clearInterval(pollingInterval);
          await tryDeleteMessage(ctx, session, authUrlMsgId, {
            command: 'endfield.auth',
            phase: 'timeout',
          });
          resolve(session.text('.authExpiredError'));
          return;
        }

        try {
          const statusData = await authApi.getStatus(request_id);

          const { status, framework_token, user_info, binding_info } = statusData;

          if (status === AUTH_STATUS.APPROVED || status === AUTH_STATUS.USED) {
            clearInterval(pollingInterval);

            try {
              await ctx.database.upsert('endfield_bindings_v3', [
                {
                  user_id: session.userId,
                  framework_token: framework_token,
                  user_info: user_info,
                  binding_info: binding_info,
                  expires_at: dayjs(expires_at).toDate(),
                },
              ]);

              await tryDeleteMessage(ctx, session, authUrlMsgId, {
                command: 'endfield.auth',
                phase: 'approved',
                requestId: request_id,
              });

              const successText = session.text('.authSuccess', {
                userNickname: user_info.nickname,
                roleNickname: binding_info.nickname,
                roleId: binding_info.role_id,
              });
              resolve(successText);
            } catch (error) {
              logPluginError(ctx, 'endfield.auth failed while saving binding', error, {
                requestId: request_id,
                userId: session.userId,
              });
              resolve(session.text('endfield.networkError'));
            }
          } else if (status === AUTH_STATUS.REJECTED) {
            clearInterval(pollingInterval);
            await tryDeleteMessage(ctx, session, authUrlMsgId, {
              command: 'endfield.auth',
              phase: 'rejected',
              requestId: request_id,
            });
            resolve(session.text('.authRejectedError'));
          } else if (status === AUTH_STATUS.EXPIRED) {
            clearInterval(pollingInterval);
            await tryDeleteMessage(ctx, session, authUrlMsgId, {
              command: 'endfield.auth',
              phase: 'expired',
              requestId: request_id,
            });
            resolve(session.text('.authExpiredError'));
          }
        } catch (error) {
          logPluginError(ctx, 'endfield.auth polling failed', error, {
            requestId: request_id,
            userId: session.userId,
          });
        }
      }, POLLING_CONFIG.AUTH_POLLING_INTERVAL);
    });
  } catch (error) {
    logPluginError(ctx, 'endfield.auth failed', error, {
      userId: session.userId,
    });
    return session.text('endfield.networkError');
  }
}
