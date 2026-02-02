import { Config } from '../../config/config';
import { autoSignAll } from './sign';
import { Context } from 'koishi';

export function setupAutoSign(ctx: Context, cfg: Config) {
  // Set auto sign cron job, run at 00:01 every day
  ctx.cron('1 0 * * *', async () => {
    const stats = await autoSignAll(ctx, cfg);

    // Prepare stats message
    let message = `Endfield 自动签到统计：\n`;
    message += `总用户数：${stats.total}\n`;
    message += `成功：${stats.success}\n`;
    message += `失败：${stats.failed}\n`;

    if (stats.failed > 0) {
      message += `失败用户：\n`;
      stats.failedUsers.forEach(({ userId, message: failMsg }) => {
        message += `- 用户 ID：${userId}，原因：${failMsg}\n`;
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
