import { Context } from 'koishi';
import 'koishi-plugin-puppeteer';

const cleanUrl = (url: string) => (url ? url.replace(/^<|>/g, '') : '');

const fmt = (val: unknown) => {
  const num = Number(val);
  return Number.isFinite(num) ? Math.floor(num).toString() : '-';
};

export async function generateDetailedCharacterCard(oldData: any, newData: any): Promise<string> {
  const d = oldData.detail;
  const panel = newData?.data ?? newData ?? {};

  const equipKeys = ['armEquip', 'bodyEquip', 'firstAccessory', 'secondAccessory'];
  const equipHtml = equipKeys
    .map((k) => d[k])
    .filter((item) => item && item.equipData)
    .map((item) => {
      const borderColor = item.equipData.rarity.value.includes('金') ? '#ffdd57' : '#a35dda';
      return `
  <div class="box is-shadowless p-2 mb-0" style="background:#f9f9f9; border:1px solid #eee; display:flex; align-items:center; border-bottom: 3px solid ${borderColor}; height: 100%;">
    <figure class="image is-48x48 mr-3 is-flex-shrink-0">
      <img src="${cleanUrl(item.equipData.iconUrl)}" class="is-rounded" style="background:#ddd;">
    </figure>
    <div style="overflow:hidden; flex:1;">
      <p class="is-size-7 has-text-weight-bold has-text-grey-dark" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.equipData.name}</p>
      <span class="tag is-white is-light has-text-grey-light has-text-weight-bold" style="border:1px solid #ddd; height:1.4em; min-height:unset;">Lv.${item.equipData.level.value}</span>
    </div>
  </div>
      `;
    })
    .join('');

  const userSkills = d.userSkills || {};
  const skillsHtml = d.charData.skills
    .map((s: any) => {
      const uSkill = userSkills[s.id] || { level: 1, maxLevel: 1 };

      return `
  <div class="column is-12 my-1 p-1">
    <div class="is-flex is-align-items-center p-2 has-background-white" style="border:1px solid #f0f0f0; border-radius:6px;">
      <div style="width:36px; height:36px; background:#333; border-radius:4px; margin-right:12px; overflow:hidden; flex-shrink:0;">
        <img src="${cleanUrl(s.iconUrl)}" style="object-fit:cover; width:100%; height:100%;">
      </div>
      <div style="flex:1;">
        <p class="has-text-weight-bold has-text-dark is-size-6">${s.name}</p>
        <p class="is-size-7 has-text-grey-light">${s.type.value}</p>
      </div>
      <div style="flex-shrink:0;">
        <span class="tag is-info is-light has-text-weight-semibold">Lv.${uSkill.level} / ${uSkill.maxLevel}</span>
      </div>
    </div>
  </div>
    `;
    })
    .join('');

  // All seven stats in a single flat array for the unified stat bar
  const allStats = [
    { label: '生命', en: 'HP', val: fmt(panel.maxHp), accent: true },
    { label: '攻击', en: 'ATK', val: fmt(panel.atk), accent: true },
    { label: '防御', en: 'DEF', val: fmt(panel.def), accent: true },
    { label: '力量', en: 'STR', val: fmt(panel.strength), accent: false },
    { label: '敏捷', en: 'AGI', val: fmt(panel.agility), accent: false },
    { label: '智识', en: 'WIS', val: fmt(panel.wisdom), accent: false },
    { label: '意志', en: 'WIL', val: fmt(panel.will), accent: false },
  ];

  const statCellsHtml = allStats
    .map(
      (s) => `
    <div class="stat-cell${s.accent ? ' stat-accent' : ''}">
      <div class="stat-num">${s.val}</div>
      <div class="stat-meta">
        <span class="stat-cn">${s.label}</span>
        <span class="stat-en">${s.en}</span>
      </div>
    </div>`
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bulma/1.0.4/css/bulma.min.css">
    <style>
      body {
        background-color: transparent;
        width: 900px;
        margin: 0; padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Maple Mono NF CN, Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .main-card {
        display: flex;
        background: white;
        overflow: hidden;
        min-height: 600px;
      }
      .col-poster {
        width: 38%;
        position: relative;
        background: #f0f0f0;
        display: flex;
        flex-direction: column;
      }
      .poster-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top center;
        display: block;
      }
      .poster-overlay {
        position: absolute;
        bottom: 0; left: 0; right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.85) 10%, transparent);
        padding: 60px 20px 20px;
        color: white;
      }
      .col-content {
        width: 62%;
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .section-title {
        font-size: 11px;
        font-weight: 800;
        color: #c0c0c0;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-bottom: 2px solid #f5f5f5;
        padding-bottom: 4px;
        margin-bottom: 8px;
      }

      /* ---- Stat Bar ---- */
      .stat-bar {
        display: flex;
        gap: 0;
        background: #fafbfc;
        border: 1px solid #eef0f2;
        border-radius: 8px;
        overflow: hidden;
      }
      .stat-cell {
        flex: 1;
        text-align: center;
        padding: 10px 4px 8px;
        border-right: 1px solid #eef0f2;
        min-width: 0;
      }
      .stat-cell:last-child { border-right: none; }
      .stat-accent {
        background: #f4f6f8;
      }
      .stat-accent .stat-num {
        color: #1a1a2e;
      }
      .stat-num {
        font-size: 18px;
        font-weight: 800;
        color: #3a3a4a;
        line-height: 1.1;
        letter-spacing: -0.5px;
      }
      .stat-meta {
        margin-top: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
      }
      .stat-cn {
        font-size: 11px;
        font-weight: 600;
        color: #888;
      }
      .stat-en {
        font-size: 9px;
        font-weight: 700;
        color: #bbb;
        letter-spacing: 0.5px;
      }
    </style>
  </head>
  <body>
    <div class="main-card">
      <!-- Left: Hero Image -->
      <div class="col-poster">
        <img src="${cleanUrl(d.charData.illustrationUrl)}" class="poster-img">
        <div class="poster-overlay">
          <h1 class="title is-3 has-text-white mb-2">${d.charData.name}</h1>
          <div class="tags">
            <span class="tag is-black is-radiusless">${d.charData.profession.value}</span>
            <span class="tag is-warning is-radiusless has-text-weight-bold">Lv.${d.level}</span>
            <span class="tag is-info is-radiusless has-text-weight-semibold">潜能 ${d.potentialLevel}</span>
          </div>
        </div>
      </div>

      <!-- Right: Info -->
      <div class="col-content">

        <!-- Panel Stats -->
        <div>
          <div class="section-title">Panel</div>
          <div class="stat-bar">
            ${statCellsHtml}
          </div>
        </div>

        <!-- Weapon -->
        <div>
          <div class="section-title">Weapon</div>
          <div class="media" style="align-items:center;">
            <figure class="media-left mb-0">
              <p class="image is-48x48" style="background:#fafafa; padding:2px; border:1px solid #eee; border-radius:4px;">
                <img src="${cleanUrl(d.weapon.weaponData.iconUrl)}">
              </p>
            </figure>
            <div class="media-content">
              <p class="title is-6 has-text-dark mb-2">${d.weapon.weaponData.name}</p>
              <div class="tags has-text-weight-semibold">
                <span class="tag is-light">Lv.${d.weapon.level}</span>
                <span class="tag is-danger is-light">潜能 ${d.weapon.refineLevel + 1}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Equipment -->
        <div>
          <div class="section-title">Equipment</div>
          <div class="fixed-grid is-col-2">
            <div class="grid is-gap-1">
              ${equipHtml}
            </div>
          </div>
        </div>

        <!-- Tactical Item -->
        ${
          d.tacticalItem
            ? `
        <div>
          <div class="section-title">Tactical</div>
          <div class="is-flex is-align-items-center has-background-light p-2" style="border-radius:4px;">
            <span class="icon has-text-grey mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase-medical-icon lucide-briefcase-medical"><path d="M12 11v4"/><path d="M14 13h-4"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M18 6v14"/><path d="M6 6v14"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
            </span>
            <figure class="image is-24x24 mr-2">
              <img src="${cleanUrl(d.tacticalItem.tacticalItemData.iconUrl)}" alt="${d.tacticalItem.tacticalItemData.name}">
            </figure>
            <span class="is-size-7 has-text-weight-bold has-text-grey-dark">${d.tacticalItem.tacticalItemData.name}</span>
          </div>
        </div>
        `
            : ''
        }

        <!-- Skills -->
        <div style="margin-top:auto;">
          <div class="section-title">Skills</div>
          <div class="columns is-multiline is-gapless mb-0">
            ${skillsHtml}
          </div>
        </div>

      </div>
    </div>
  </body>
  </html>`;
}

export async function renderDetailedCharacterCard(
  ctx: Context,
  cardData: any,
  detailedCardData: any
): Promise<string> {
  const { puppeteer } = ctx;

  const html = await generateDetailedCharacterCard(cardData, detailedCardData);
  return puppeteer.render(html);
}
