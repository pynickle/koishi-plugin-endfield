import { cacheImages } from '../../utils/image-cache';
import { CharacterNoteDetail, AchievementMedal } from '../api';
import { Context } from 'koishi';
import dayjs from 'dayjs';

const cleanUrl = (url: string) => (url ? url.replace(/^<|>/g, '') : '');

function resolveMedalIcon(medal: AchievementMedal): string {
  const { achievementData, isPlated } = medal;

  // 1. reforge3Icon (highest precedence)
  if (achievementData.reforge3Icon && achievementData.reforge3Icon.trim()) {
    return cleanUrl(achievementData.reforge3Icon);
  }

  // 2. reforge2Icon
  if (achievementData.reforge2Icon && achievementData.reforge2Icon.trim()) {
    return cleanUrl(achievementData.reforge2Icon);
  }

  // 3. platedIcon (only if isPlated is true AND platedIcon exists)
  if (isPlated && achievementData.platedIcon && achievementData.platedIcon.trim()) {
    return cleanUrl(achievementData.platedIcon);
  }

  // 4. initIcon (fallback)
  return cleanUrl(achievementData.initIcon);
}

export async function generateProfileImage(
  ctx: Context,
  note: CharacterNoteDetail
): Promise<string> {
  const base = note.base;
  const achieve = note.achieve;
  const bpSystem = note.bpSystem;

  const lastLoginTime = dayjs(Number(base.lastLoginTime) * 1000).format('YYYY-MM-DD HH:mm:ss');

  const badgeUrls: string[] = [];
  const medalMap = new Map(achieve?.achieveMedals?.map((m) => [m.achievementData.id, m]) ?? []);

  const displaySlots = achieve?.display ?? {};
  const slotNumbers = Object.keys(displaySlots)
    .map(Number)
    .filter((n) => n >= 1 && n <= 10)
    .sort((a, b) => a - b)
    .slice(0, 10);

  const displayedMedals: Array<{ medal: AchievementMedal; slot: number }> = [];
  for (const slot of slotNumbers) {
    const medalId = displaySlots[String(slot)];
    if (medalId && medalMap.has(medalId)) {
      const medal = medalMap.get(medalId)!;
      const iconUrl = resolveMedalIcon(medal);
      if (iconUrl) {
        badgeUrls.push(iconUrl);
        displayedMedals.push({ medal, slot });
      }
    }
  }

  const cachedBadgeMap = await cacheImages(ctx, badgeUrls, 6);

  const badgeCardsHtml = displayedMedals
    .map(({ medal }) => {
      const iconUrl = resolveMedalIcon(medal);
      const cachedIcon = cachedBadgeMap.get(iconUrl) || iconUrl;
      const medalName = medal.achievementData.name;
      const obtainDate = dayjs(Number(medal.obtainTs) * 1000).format('YYYY-MM-DD');
      return `
         <div class="column is-6-mobile is-4-tablet is-one-fifth-desktop">
          <div class="badge-card has-text-centered">
            <figure class="image is-64x64 mx-auto mb-2">
              <img src="${cachedIcon}" alt="${medalName}" width="64" height="64" loading="eager">
            </figure>
            <p class="title is-7">${medalName}</p>
            <p class="subtitle is-7 has-text-grey-light">${obtainDate}</p>
          </div>
        </div>
      `;
    })
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bulma/1.0.4/css/bulma.min.css">
    <style>
      body {
        background-color: #f5f7fa;
        font-family: Maple Mono NF CN, "Segoe UI", sans-serif;
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .header-card {
        background: white;
        border-radius: 10px;
        padding: 18px 20px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        border-top: 4px solid #363636;
      }
      .stat-card {
        background: white;
        border-radius: 10px;
        padding: 12px 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        height: 100%;
      }
      .mission-card {
        background: white;
        border-radius: 10px;
        padding: 18px 20px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      }
      .section-title {
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #b5b5b5;
        text-transform: uppercase;
        font-size: 12px;
      }
      .badge-card {
        background: white;
        border-radius: 10px;
        padding: 12px 10px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        height: 100%;
      }
      .badge-card img {
        object-fit: cover;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <div class="header-card mb-4">
      <div class="level is-mobile">
        <div class="level-left">
          <div class="level-item">
            <div>
              <p class="title is-4 mb-1">${base.name}</p>
              <p class="subtitle is-7 has-text-grey ml-1">UID: ${base.roleId || '未知'} | 世界等级: ${base.worldLevel} | 等级: ${base.level}</p>
            </div>
          </div>
        </div>
        <div class="level-right">
          <span class="tag is-black">个人名片</span>
        </div>
      </div>
    </div>

    <div class="columns is-multiline is-mobile mb-4">
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">武器数</p>
          <p class="title is-4">${base.weaponNum}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">成就数</p>
          <p class="title is-4">${achieve?.count ?? 0}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">通行证等级</p>
          <p class="title is-4">${bpSystem?.curLevel ?? '-'} / ${bpSystem?.maxLevel ?? '-'}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">上次登录</p>
          <p class="title is-6 mt-2">${lastLoginTime}</p>
        </div>
      </div>
    </div>

    <div class="mission-card mb-4">
      <p class="section-title mb-2">主线进度</p>
      <p class="title is-5">${base.mainMission?.description || '未知'}</p>
    </div>

    <div class="level mb-2">
      <div class="level-left">
        <span class="section-title">徽章展柜</span>
      </div>
    </div>

    <div class="columns is-multiline is-mobile">
      ${badgeCardsHtml}
    </div>
  </body>
  </html>
  `;
}

export async function renderProfileImage(ctx: Context, note: CharacterNoteDetail): Promise<string> {
  const { puppeteer } = ctx;
  const html = await generateProfileImage(ctx, note);
  return puppeteer.render(html);
}
