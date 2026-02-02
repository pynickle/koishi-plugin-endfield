import { Config } from '../../config/config';
import { createTextMsg } from '../../utils/cqcode-utils';
import { Context, Session } from 'koishi';

export async function endfieldAuth(ctx: Context, session: Session, cfg: Config) {
  try {
    const createRequestUrl = new URL('/api/v1/authorization/requests', cfg.apiBaseUrl);
    const createRequestResponse = await fetch(createRequestUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': cfg.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: 'yuan-bot',
        client_name: 'Yuan Bot',
        client_type: 'bot',
        scopes: ['user_info', 'binding_info'],
      }),
    });

    const createRequestData = await createRequestResponse.json();

    if (createRequestData.code !== 0) {
      return session.text('.authRequestError');
    }

    const { request_id, auth_url, expires_at } = createRequestData.data;
    const fullAuthUrl = new URL(auth_url, cfg.clientUrl).toString();

    const authText = session.text('.authUrl', {
      url: fullAuthUrl,
      expiresAt: new Date(expires_at).toLocaleString(),
    });
    const authUrlMsgId = await session.onebot.sendGroupMsg(session.channelId, [
      createTextMsg(authText),
    ]);

    let pollingInterval;
    let pollingAttempts = 0;
    const maxAttempts = 30;

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
          const statusResponse = await fetch(statusUrl, {
            headers: {
              'X-API-Key': cfg.apiKey,
            },
          });

          const statusData = await statusResponse.json();

          if (statusData.code === 0) {
            const { status, framework_token, user_info, binding_info } = statusData.data;

            if (status === 'approved' || status === 'used') {
              clearInterval(pollingInterval);

              try {
                await ctx.database.upsert('endfield_bindings', [
                  {
                    user_id: session.id,
                    framework_token: framework_token,
                    user_info: user_info,
                    binding_info: binding_info,
                    expires_at: new Date(expires_at),
                  },
                ]);

                await session.onebot.deleteMsg(authUrlMsgId);

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
