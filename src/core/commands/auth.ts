import { Config } from '../../config/config';
import { createTextMsg } from '../../utils/cqcode-utils';
import axios from 'axios';
import dayjs from 'dayjs';
import { Context, Session } from 'koishi';

export async function endfieldAuth(ctx: Context, session: Session, cfg: Config) {
  try {
    const createRequestUrl = new URL('/api/v1/authorization/requests', cfg.apiBaseUrl);
    const createRequestResponse = await axios.post(
      createRequestUrl.toString(),
      {
        client_id: 'yuan-bot',
        client_name: 'Yuan Bot',
        client_type: 'bot',
        scopes: ['user_info', 'binding_info'],
      },
      {
        headers: {
          'X-API-Key': cfg.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const createRequestData = createRequestResponse.data;

    if (createRequestData.code !== 0) {
      return session.text('.authRequestError');
    }

    const { request_id, auth_url, expires_at } = createRequestData.data;
    const fullAuthUrl = new URL(auth_url, cfg.clientUrl).toString();

    const authText = session.text('.authUrl', {
      url: fullAuthUrl,
      expiresAt: dayjs(expires_at).format('YYYY-MM-DD HH:mm:ss'),
    });

    let authUrlMsgId: string | number;
    if (session.onebot) {
      authUrlMsgId = await session.onebot.sendGroupMsg(session.channelId, [
        createTextMsg(authText),
      ]);
    } else {
      await session.send(authText);
    }

    let pollingInterval;
    let pollingAttempts = 0;
    const maxAttempts = 75;

    return new Promise<string>((resolve) => {
      pollingInterval = setInterval(async () => {
        pollingAttempts++;

        if (pollingAttempts > maxAttempts) {
          clearInterval(pollingInterval);
          return;
        }

        try {
          const statusUrl = new URL(
            `/api/v1/authorization/requests/${request_id}/status`,
            cfg.apiBaseUrl
          );
          const statusResponse = await axios.get(statusUrl.toString(), {
            headers: {
              'X-API-Key': cfg.apiKey,
            },
          });

          const statusData = statusResponse.data;

          if (statusData.code === 0) {
            const { status, framework_token, user_info, binding_info } = statusData.data;

            if (status === 'approved' || status === 'used') {
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

                if (session.onebot) {
                  await session.onebot.deleteMsg(authUrlMsgId);
                }

                const successText = session.text('.authSuccess', {
                  userNickname: user_info.nickname,
                  roleNickname: binding_info.nickname,
                  roleId: binding_info.role_id,
                });
                resolve(successText);
              } catch (error) {
                ctx.logger.error('Endfield bind error:', error);
                resolve(session.text('endfield.networkError'));
              }
            } else if (status === 'rejected') {
              clearInterval(pollingInterval);
              resolve(session.text('.authRejectedError'));
            } else if (status === 'expired') {
              clearInterval(pollingInterval);
              resolve(session.text('.authExpiredError'));
            }
          }
        } catch (error) {
          ctx.logger.error('Polling error:', error);
        }
      }, 3000);
    });
  } catch (error) {
    ctx.logger.error('Endfield bind error:', error);
    return session.text('endfield.networkError');
  }
}
