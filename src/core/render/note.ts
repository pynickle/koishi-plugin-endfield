import { CharacterNoteDetail } from '../api';
import { Context } from 'koishi';

const cleanUrl = (url: string) => (url ? url.replace(/^<|>/g, '') : '');

const rarityColorMap: Record<string, { border: string; text: string }> = {
  '6': { border: '#ffdd57', text: '#946c00' },
  '5': { border: '#a35dda', text: '#5b2a86' },
  '4': { border: '#4c8bf5', text: '#1f4ea1' },
  '3': { border: '#37c7ab', text: '#0f766e' },
  '2': { border: '#a0a0a0', text: '#4a4a4a' },
  '1': { border: '#a0a0a0', text: '#4a4a4a' },
};

const getRarityStyle = (rarity: string | number) => {
  const key = String(rarity);
  return rarityColorMap[key] || { border: '#dbdbdb', text: '#4a4a4a' };
};

export async function generateOperatorList(note: CharacterNoteDetail): Promise<string> {
  const base = note.base;
  const sortedChars = [...note.chars].sort((a, b) => {
    const rarityA = Number(a.rarity?.value || 0);
    const rarityB = Number(b.rarity?.value || 0);
    if (rarityA !== rarityB) return rarityB - rarityA;
    return b.level - a.level;
  });

  const charCards = sortedChars
    .map((char) => {
      const rarity = char.rarity?.value || '0';
      const style = getRarityStyle(rarity);
      return `
        <div class="column is-6-mobile is-4-tablet is-3-desktop">
          <div class="card operator-card" style="border-top: 4px solid ${style.border};">
            <div class="card-image">
              <figure class="image is-square">
                <img src="${cleanUrl(char.avatarRtUrl || char.avatarSqUrl)}" alt="${char.name}">
              </figure>
            </div>
            <div class="card-content p-3">
              <p class="title is-6 mb-1">${char.name}</p>
              <div class="tags has-addons mb-1">
                <span class="tag is-info">${char.profession?.value || '未知'}</span>
                <span class="tag is-light icon-text" style="color:${style.text};">
                  <span class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
                  </span>
                  ${rarity}
                </span>
                <span class="tag is-warning is-light">Lv.${char.level}</span>
              </div>
            </div>
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
      .header-avatar img {
        border-radius: 50%;
        width: 64px;
        height: 64px;
        object-fit: cover;
        background: #eee;
      }
      .stat-card {
        background: white;
        border-radius: 10px;
        padding: 12px 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        height: 100%;
      }
      .operator-card {
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0,0,0,0.06);
        background: white;
      }
      .operator-card img {
        object-fit: cover;
      }
      .section-title {
        font-weight: 800;
        letter-spacing: 0.06em;
        color: #b5b5b5;
        text-transform: uppercase;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header-card mb-4">
      <div class="level is-mobile">
        <div class="level-left">
          <div class="level-item header-avatar mr-3">
            <img src="${cleanUrl(base.avatarUrl)}" alt="${base.name}">
          </div>
          <div class="level-item">
            <div>
              <p class="title is-4 mb-1">${base.name}</p>
              <p class="subtitle is-7 has-text-grey">UID: ${base.roleId || '未知'} | 世界等级: ${base.worldLevel}</p>
            </div>
          </div>
        </div>
        <div class="level-right">
          <span class="tag is-black">干员列表</span>
        </div>
      </div>
    </div>

    <div class="columns is-multiline is-mobile mb-2">
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">干员总数</p>
          <p class="title is-4">${note.charCount ?? base.charNum}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">档案数</p>
          <p class="title is-4">${base.docNum}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">武器数</p>
          <p class="title is-4">${base.weaponNum}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">通行证等级</p>
          <p class="title is-4">${note.bpSystem?.curLevel ?? '-'} / ${note.bpSystem?.maxLevel ?? '-'}</p>
        </div>
      </div>
    </div>

    <div class="level mb-2">
      <div class="level-left">
        <span class="section-title">Operators</span>
      </div>
      <div class="level-right">
        <span class="tag is-light">按稀有度/等级排序</span>
      </div>
    </div>

    <div class="columns is-multiline">
      ${charCards}
    </div>
  </body>
  </html>
  `;
}

export async function renderOperatorList(ctx: Context, note: CharacterNoteDetail): Promise<string> {
  const { puppeteer } = ctx;
  const html = await generateOperatorList(note);
  return puppeteer.render(html);
}
