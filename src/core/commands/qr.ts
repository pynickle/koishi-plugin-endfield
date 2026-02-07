import { Config } from '../../config/config';
import axios from 'axios';
import dayjs from 'dayjs';
import { Context, Session } from 'koishi';

export async function endfieldQr(ctx: Context, session: Session, cfg: Config) {
  try {
    // Step 1: Get login QR code
    const qrUrl = new URL('/login/endfield/qr', cfg.apiBaseUrl);
    const qrResponse = await axios.get(qrUrl.toString(), {
      headers: {
        'X-API-KEY': cfg.apiKey,
      },
    });

    const qrData = qrResponse.data;
    if (qrData.code !== 0) {
      return session.text('.qrError', {
        message: qrData.message,
      });
    }

    const { framework_token, qrcode, expire } = qrData.data;
    if (!framework_token || !qrcode) {
      return session.text('.qrInvalidData');
    }

    // Step 2: Send QR code to user
    const scanPrompt = session.text('.scanPrompt');
    const expirePrompt = session.text('.expirePrompt', {
      expireTime: dayjs(expire).toDate().toLocaleString(),
    });

    let qrMsgId: string | number;
    if (session.onebot) {
      qrMsgId = await session.onebot.sendGroupMsg(session.channelId, [
        {
          type: 'text',
          data: {
            text: `${scanPrompt}\n`,
          },
        },
        {
          type: 'image',
          data: {
            file: qrcode,
          },
        },
        {
          type: 'text',
          data: {
            text: `\n${expirePrompt}`,
          },
        },
      ]);
    } else {
      await session.send(`${scanPrompt}\n<img src="${qrcode}"/>\n${expirePrompt}`);
    }

    // Step 3: Poll for scan status
    let finalFrameworkToken = framework_token;

    const pollInterval = setInterval(async () => {
      try {
        const statusUrl = new URL('/login/endfield/qr/status', cfg.apiBaseUrl);
        statusUrl.searchParams.append('framework_token', framework_token);

        const statusResponse = await axios.get(statusUrl.toString(), {
          headers: {
            'X-API-KEY': cfg.apiKey,
          },
        });

        const statusData = statusResponse.data;
        if (statusData.code !== 0) {
          clearInterval(pollInterval);
          await session.send(
            session.text('commands.endfield.qr.messages.statusError', {
              message: statusData.message,
            })
          );
          return;
        }

        const { status, remaining_ms } = statusData.data;

        if (status === 'done') {
          clearInterval(pollInterval);

          // Step 4: Confirm login
          const confirmUrl = new URL('/login/endfield/qr/confirm', cfg.apiBaseUrl);
          const confirmResponse = await axios.post(
            confirmUrl.toString(),
            { framework_token },
            {
              headers: {
                'X-API-KEY': cfg.apiKey,
                'Content-Type': 'application/json',
              },
            }
          );

          const confirmData = confirmResponse.data;
          if (confirmData.code !== 0) {
            await session.send(
              session.text('commands.endfield.qr.messages.confirmError', {
                message: confirmData.message,
              })
            );
            return;
          }

          finalFrameworkToken = confirmData.data.framework_token;

          // Step 5: Get binding info
          const bindingInfoMsg = session.text('commands.endfield.qr.messages.gettingBindingInfo');
          let bindingInfoMsgId: string | number;

          if (session.onebot) {
            bindingInfoMsgId = await session.onebot.sendGroupMsg(session.channelId, [
              {
                type: 'text',
                data: {
                  text: bindingInfoMsg,
                },
              },
            ]);
          } else {
            await session.send(bindingInfoMsg);
          }

          const bindingUrl = new URL('/api/endfield/binding', cfg.apiBaseUrl);
          const bindingResponse = await axios.get(bindingUrl.toString(), {
            headers: {
              'X-Framework-Token': finalFrameworkToken,
              'X-API-KEY': cfg.apiKey,
            },
          });

          const bindingData = bindingResponse.data;
          if (bindingData.code !== 0) {
            if (session.onebot) {
              await session.onebot.deleteMsg(bindingInfoMsgId);
            }
            await session.send(
              session.text('commands.endfield.qr.messages.bindingError', {
                message: bindingData.message,
              })
            );
            return;
          }

          const bindingList = bindingData.data.bindingList;

          if (!bindingList || bindingList.length === 0) {
            if (session.onebot) {
              await session.onebot.deleteMsg(bindingInfoMsgId);
            }
            await session.send(session.text('commands.endfield.qr.messages.noBindingInfo'));
            return;
          }

          const defaultRole = bindingList[0].defaultRole;

          // Step 6: Save to database
          await ctx.database.upsert('endfield_bindings_v3', [
            {
              user_id: session.userId,
              framework_token: finalFrameworkToken,
              user_info: {
                nickname: defaultRole.nickname,
              },
              binding_info: {
                role_id: defaultRole.roleId,
                nickname: defaultRole.nickname,
                level: defaultRole.level,
                server_id: defaultRole.serverId,
              },
              expires_at: new Date(statusData.expire),
            },
          ]);

          // Step 7: Delete messages after login
          if (session.onebot) {
            await session.onebot.deleteMsg(qrMsgId);
            await session.onebot.deleteMsg(bindingInfoMsgId);
          }

          await session.send(
            session.text('commands.endfield.qr.messages.loginSuccess', {
              roleName: defaultRole.nickname,
              roleId: defaultRole.roleId,
            })
          );
        } else if (status === 'expired') {
          clearInterval(pollInterval);
          await session.send(session.text('commands.endfield.qr.messages.qrExpired'));
        }
      } catch (error) {
        clearInterval(pollInterval);
        ctx.logger.error('QR login error:', error);
        await session.send(session.text('commands.endfield.qr.messages.loginError'));
      }
    }, 2000);
  } catch (error) {
    ctx.logger.error('Endfield QR login error:', error);
    return session.text('endfield.networkError');
  }
}
