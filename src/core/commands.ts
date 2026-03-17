import { Config } from '../config/config';
import { endfieldAnnouncement } from './commands/announcement';
import { endfieldAuth } from './commands/auth';
import { endfieldChar } from './commands/char';
import { endfieldGacha } from './commands/gacha';
import { endfieldNote } from './commands/note';
import { endfieldProfile } from './commands/profile';
import { endfieldQr } from './commands/qr';
import { endfieldSetWeaponUp } from './commands/setweaponup';
import { endfieldSign, endfieldSignAll } from './commands/sign';
import { endfieldStamina } from './commands/stamina';
import {
  endfieldSubscribe,
  endfieldUnsubscribe,
  endfieldStaminaSubscribe,
  endfieldStaminaUnsubscribe,
} from './commands/subscribe';
import { Context } from 'koishi';

export function registerCommands(ctx: Context, cfg: Config) {
  ctx.command('endfield.auth').action(async ({ session }) => endfieldAuth(ctx, session, cfg));
  ctx.command('endfield.sign').action(async ({ session }) => endfieldSign(ctx, session, cfg));
  ctx
    .command('endfield.signall', { authority: 4 })
    .action(async ({ session }) => endfieldSignAll(ctx, session, cfg));
  ctx
    .command('endfield.char <charName>')
    .action(async ({ session }, charName) => endfieldChar(ctx, session, cfg, charName));
  ctx.command('endfield.note').action(async ({ session }) => endfieldNote(ctx, session, cfg));
  ctx.command('endfield.profile').action(async ({ session }) => endfieldProfile(ctx, session, cfg));
  ctx
    .command('endfield.gacha')
    .option('noSync', '-n 不同步直接获取抽卡记录')
    .action(async ({ session, options }) => endfieldGacha(ctx, session, cfg, options));
  ctx.command('endfield.stamina').action(async ({ session }) => endfieldStamina(ctx, session, cfg));

  if (cfg.enableStaminaSubscriptions) {
    ctx
      .command('endfield.subscribe <time>')
      .action(async ({ session }, time) => endfieldSubscribe(ctx, session, cfg, time));
    ctx
      .command('endfield.unsubscribe')
      .action(async ({ session }) => endfieldUnsubscribe(ctx, session, cfg));
    ctx
      .command('endfield.stamina.subscribe <duration:string> [reminder_interval:string]')
      .action(async ({ session }, duration, reminder_interval) =>
        endfieldStaminaSubscribe(ctx, session, cfg, duration, reminder_interval)
      );
    ctx
      .command('endfield.stamina.unsubscribe')
      .action(async ({ session }) => endfieldStaminaUnsubscribe(ctx, session, cfg));
  }

  ctx
    .command('endfield.announcement', { authority: 4 })
    .action(async ({ session }) => endfieldAnnouncement(ctx, session, cfg));
  ctx.command('endfield.qr').action(async ({ session }) => endfieldQr(ctx, session, cfg));
  ctx
    .command('endfield.setweaponup <poolId> <weaponName>', { authority: 4 })
    .action(async ({ session }, poolId, weaponName) =>
      endfieldSetWeaponUp(ctx, session, cfg, poolId, weaponName)
    );
}
