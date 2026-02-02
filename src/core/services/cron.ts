import { Config } from '../../config/config';
import { autoSignAll } from './sign';
import { Context } from 'koishi';

export function setupAutoSign(ctx: Context, cfg: Config) {
  // Set auto sign cron job, run at 00:01 every day
  ctx.cron('1 0 * * *', async () => {
    const stats = await autoSignAll(ctx, cfg);

    // Prepare stats message
    let message = `Endfield auto sign stats:\n`;
    message += `Total users: ${stats.total}\n`;
    message += `Success: ${stats.success}\n`;
    message += `Failed: ${stats.failed}\n`;

    if (stats.failed > 0) {
      message += `Failed users:\n`;
      stats.failedUsers.forEach(({ userId, message: failMsg }) => {
        message += `- User ID: ${userId}, Reason: ${failMsg}\n`;
      });
    }

    // Send message to admin QQ
    try {
      await (ctx as any).onebot.sendPrivateMsg(cfg.adminQQ, message);
    } catch (error) {
      ctx.logger.error('Failed to send stats to admin:', error);
    }
  });
}
