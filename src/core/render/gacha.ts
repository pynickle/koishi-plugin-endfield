import { Config } from '../../config/config';
import axios from 'axios';
import { Context } from 'koishi';

interface GachaRecord {
  char_id: string;
  char_name: string;
  rarity: number;
  gacha_ts: string;
  pool_id: string;
  pool_name: string;
  is_new: boolean;
  is_free: boolean;
  seq_id: string;
}

interface ProcessedPool {
  name: string;
  type: 'special' | 'weapon' | 'standard' | 'beginner';
  total: number;
  pity: number;
  records: GachaRecord[];
  star6: { name: string; count: number; isUp: boolean }[];
  star5Count: number;
  poolId: string;
}

interface PoolVersion {
  version: string;
  parts: number[];
  specialPool?: ProcessedPool;
  weaponPool?: ProcessedPool;
}

export async function generateGachaRecord(
  ctx: Context,
  cfg: Config,
  data: { records: GachaRecord[]; user_info: any },
  poolInfoList: CharPool[]
): Promise<string> {
  const { records, user_info } = data;

  records.reverse();

  // Stats Containers
  let totalPulls = 0;
  let total6Star = 0;

  // Category Aggregates
  const categoryStats = {
    special: { pulls: 0, sixStar: 0, upSixStar: 0, pity: 0 },
    weapon: { pulls: 0, sixStar: 0, upSixStar: 0, pity: 0 },
    standard: { pulls: 0, sixStar: 0, upSixStar: 0, pity: 0 },
    beginner: { pulls: 0, sixStar: 0, upSixStar: 0, pity: 0 },
  };

  // Pool Logic Processing
  const poolsMap = new Map<string, ProcessedPool>();

  const getPoolType = (id: string): 'special' | 'weapon' | 'standard' | 'beginner' => {
    if (id.includes('beginner')) return 'beginner';
    if (id.includes('weaponbox_constant')) return 'weapon';
    if (id === 'standard') return 'standard';
    return 'special';
  };

  const extractVersion = (poolId: string): string => {
    const match = poolId.match(/(special|weaponbox|weponbox)_(\d+_\d+_\d+)/);
    return match ? match[2] : '';
  };

  const isUpChar = (charName: string, poolName: string, poolId: string) => {
    const info = poolInfoList.find((p) => p.name === poolName || p.pool_id === poolId);
    if (!info) return false;
    return info.chars?.some((c) => c.name === charName && c.rarity === 'rarity_6');
  };

  const isUpWeapon = async (weaponName: string, poolId: string): Promise<boolean> => {
    try {
      // Handle weaponbox_constant pools with hardcoded up weapons
      const constantWeaponMap: Record<string, string> = {
        weaponbox_constant_1: '赫拉芬格',
        weaponbox_constant_2: '沧溟星梦',
        weaponbox_constant_3: '不知归',
        weaponbox_constant_4: '负山',
        weaponbox_constant_5: '大雷斑',
      };

      if (poolId in constantWeaponMap) {
        return weaponName === constantWeaponMap[poolId];
      }

      // Get weapon pool info from database
      const weaponPoolInfo = await ctx.database.get('endfield_weapon_pools', poolId);
      if (weaponPoolInfo.length === 0) return false;

      // Check if weapon is in up_weapons list
      return weaponPoolInfo[0].up_weapons.some((weapon: any) => weapon.name === weaponName);
    } catch (error) {
      ctx.logger.error('Error checking up weapon:', error);
      return false;
    }
  };

  const getPoolDominantColor = (poolId: string): string => {
    const info = poolInfoList.find((p) => p.pool_id === poolId);
    return info?.dominant_color || '#ff3860';
  };

  // Process Pity and Distribution
  const poolPityCounter = new Map<string, number>();

  for (const rec of records) {
    totalPulls++;

    if (rec.is_free) continue;
    const pKey = rec.pool_id;
    const pType = getPoolType(pKey);

    if (!poolsMap.has(pKey)) {
      poolsMap.set(pKey, {
        name: rec.pool_name,
        type: pType,
        total: 0,
        pity: 0,
        records: [],
        star6: [],
        star5Count: 0,
        poolId: pKey,
      });
      poolPityCounter.set(pKey, 0);
    }

    const poolData = poolsMap.get(pKey)!;
    const currentPity = poolPityCounter.get(pKey) + 1;

    poolData.total++;

    // Global Category Stats
    categoryStats[pType].pulls++;

    if (rec.rarity === 6) {
      const isUp =
        pType === 'special' || pType === 'weapon'
          ? isUpChar(rec.char_name, rec.pool_name, rec.pool_id) ||
            (await isUpWeapon(rec.char_name, rec.pool_id))
          : false;

      poolData.star6.push({
        name: rec.char_name,
        count: currentPity,
        isUp,
      });

      total6Star++;
      categoryStats[pType].sixStar++;
      if (isUp) categoryStats[pType].upSixStar++;

      poolPityCounter.set(pKey, 0);
    } else {
      poolPityCounter.set(pKey, currentPity);
    }

    // Update live pity in object
    poolData.pity = poolPityCounter.get(pKey) || 0;
  }

  for (const [pKey, pValue] of poolPityCounter) {
    const pType = getPoolType(pKey);
    categoryStats[pType].pity += pValue;
  }

  // Calculate Aggregates
  const globalAvg =
    total6Star > 0
      ? (
          (totalPulls - [...poolPityCounter.values()].reduce((sum, v) => sum + v, 0)) /
          total6Star
        ).toFixed(1)
      : '0';
  const specialAvgUp =
    categoryStats.special.upSixStar > 0
      ? (
          (categoryStats.special.pulls - categoryStats.special.pity) /
          categoryStats.special.upSixStar
        ).toFixed(1)
      : categoryStats.special.sixStar > 0
        ? 'N/A'
        : '-';
  const weaponAvg =
    categoryStats.weapon.sixStar > 0
      ? (
          categoryStats.weapon.pulls -
          categoryStats.weapon.pity / categoryStats.weapon.sixStar
        ).toFixed(1)
      : '-';

  // Luck evaluation colors
  const getLuckColor = (val: number, benchmark: number) => {
    if (val === 0) return '';
    if (val < benchmark * 0.8) return 'has-text-success-dark';
    if (val > benchmark * 1.2) return 'has-text-danger-dark';
    return 'has-text-grey-dark';
  };

  const getPityColor = (val: number) => {
    if (val > 60) return 'has-text-danger';
    if (val > 40) return 'has-text-warning-dark';
    return 'has-text-success';
  };

  // Render Functions
  const renderPoolCard = (pool: ProcessedPool, color?: string) => {
    const reversedHistory = [...pool.star6].reverse();
    const avg =
      pool.star6.length > 0 ? ((pool.total - pool.pity) / pool.star6.length).toFixed(1) : '-';

    // Stats Line
    let extraStats = '';
    if (pool.type === 'special' || pool.type === 'weapon') {
      const upCount = pool.star6.filter((s) => s.isUp).length;
      const winRate = pool.star6.length > 0 ? ((upCount / pool.star6.length) * 100).toFixed(0) : 0;
      extraStats = `<span class="tag is-light is-rounded mr-2">不歪率: <strong>${winRate}%</strong></span>`;
    }

    return `
      <div class="column is-12 box mb-4" style="border-left: 5px solid ${color ? color : pool.type === 'special' ? '#ff3860' : '#3273dc'}">
        <nav class="level is-mobile mb-2">
          <div class="level-left">
            <div class="level-item">
              <div>
                <p class="heading has-text-grey">卡池</p>
                <p class="title is-5">${pool.name}</p>
              </div>
            </div>
            <div class="level-item ml-4">
              <div>
                <p class="heading has-text-grey">当前垫刀</p>
                <p class="title is-4 ${getPityColor(pool.pity)}">${pool.pity}</p>
              </div>
            </div>
          </div>
          <div class="level-right has-text-right">
             <div>
                <p class="heading has-text-grey">总抽/金数</p>
                <span class="tag is-white is-medium"><strong>${pool.total}</strong> 抽</span>
                <span class="tag is-warning is-light is-medium"><strong>${pool.star6.length}</strong> 金</span>
                <span class="tag is-light is-medium">Avg: ${avg}</span>
             </div>
          </div>
        </nav>

        <div class="content is-small mb-2">
           ${extraStats}
        </div>

        <div class="field is-grouped is-grouped-multiline">
          ${reversedHistory.length === 0 ? '<span class="has-text-grey-light is-size-7 is-italic">暂无六星记录</span>' : ''}
          ${reversedHistory
            .map(
              (s, idx) => `
            <div class="control">
              <div class="tags has-addons">
                <span class="tag is-dark">#${pool.star6.length - idx}</span>
                <span class="tag ${s.isUp ? 'is-danger' : 'is-warning'} is-light has-text-weight-bold">
                   ${s.name}
                   ${s.isUp ? '<span class="ml-1 icon is-small">UP</span>' : ''}
                </span>
                <span class="tag ${Number(s.count) > 60 ? 'is-danger' : 'is-success'} is-light">
                  ${s.count}抽
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  };

  const poolList = Array.from(poolsMap.values());
  const versionMap = new Map<string, PoolVersion>();

  // Group pools by version
  poolList.forEach((pool) => {
    const version = extractVersion(pool.poolId);
    if (!version) return;

    if (!versionMap.has(version)) {
      const parts = version.split('_').map(Number);
      versionMap.set(version, {
        version,
        parts,
      });
    }

    const versionData = versionMap.get(version)!;
    if (pool.poolId.startsWith('special')) {
      versionData.specialPool = pool;
    } else {
      versionData.weaponPool = pool;
    }
  });

  // Sort versions in descending order
  const sortedVersions = Array.from(versionMap.values()).sort((a, b) => {
    for (let i = 0; i < 3; i++) {
      if (a.parts[i] !== b.parts[i]) {
        return b.parts[i] - a.parts[i];
      }
    }
    return 0;
  });

  const specialPools = poolList.filter((p) => p.type === 'special' && !extractVersion(p.poolId));
  const weaponPools = poolList.filter((p) => p.type === 'weapon' && !extractVersion(p.poolId));
  const otherPools = poolList.filter((p) => p.type !== 'special' && p.type !== 'weapon');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.bootcdn.net/ajax/libs/bulma/1.0.4/css/bulma.min.css">
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 40px; background-color: #f5f7fa; font-family: 'maple mono nf cn', 'Segoe UI' }
    .stat-card { height: 100%; background: white; border-radius: 8px; padding: 1.25rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .divider { border-bottom: 2px solid #dbdbdb; margin: 2rem 0 1rem; position: relative; }
    .divider::after { content: attr(data-label); position: absolute; left: 0; bottom: 5px; background: #f5f7fa; padding-right: 10px; font-weight: bold; color: #b5b5b5; font-size: 0.85rem; }
    .tag.is-warning.is-light { background-color: #fffbeb !important; color: #947600 !important; }
    .tag.is-danger.is-light { background-color: #feecf0 !important; color: #cc0f35 !important; }
  </style>
</head>
<body>
  <div class="main-container">
    <!-- User Info Header -->
    <div class="box mb-4" style="border-top: 4px solid #363636;">
      <div class="level is-mobile">
        <div class="level-left">
           <div>
             <h1 class="title is-4 mb-2">${user_info.nickname}</h1>
             <p class="subtitle is-7 has-text-grey">UID: ${user_info.game_uid || '未知'} | 服务器: ${user_info.channel_name}</p>
           </div>
        </div>
        <div class="level-right">
           <span class="tag is-black">终末地数据分析</span>
        </div>
      </div>
    </div>

    <!-- Global Stats -->
    <div class="columns is-multiline is-mobile variable-gap">
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card is-flex is-justify-content-center is-flex-direction-column has-text-centered">
          <p class="heading">总抽卡数</p>
          <p class="title is-3">${totalPulls}</p>
        </div>
      </div>
      <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card is-flex is-justify-content-center is-flex-direction-column has-text-centered">
          <p class="heading">六星总数</p>
          <p class="title is-3 has-text-warning-dark">${total6Star}</p>
        </div>
      </div>
       <div class="column is-6-mobile is-3-tablet">
        <div class="stat-card has-text-centered">
          <p class="heading">平均出货</p>
          <p class="title is-3 mb-2 ${getLuckColor(parseFloat(globalAvg), 50)}">${globalAvg}</p>
          <p class="is-size-7 has-text-grey">抽/六星</p>
        </div>
      </div>
      <!-- Conditional High Level Stat -->
      <div class="column is-6-mobile is-3-tablet">
         <div class="stat-card has-text-centered">
          <p class="heading">UP平均花费</p>
          <p class="title is-3 mb-2 ${specialAvgUp !== 'N/A' && parseFloat(specialAvgUp) < 90 ? 'has-text-success-dark' : ''}">
            ${specialAvgUp !== 'N/A' ? Math.floor(Number(specialAvgUp)) : '-'}
          </p>
          <p class="is-size-7 has-text-grey">抽/UP (限定池)</p>
        </div>
      </div>
    </div>

    <!-- Version-based Pools -->
    ${
      sortedVersions.length > 0
        ? `
    <div class="divider" data-label="限定卡池"></div>
    <div class="columns is-multiline m-1">
      ${await Promise.all(
        sortedVersions.map(async (versionData, index) => {
          const hasSpecial = !!versionData.specialPool;
          const hasWeapon = !!versionData.weaponPool;

          if (!hasSpecial && !hasWeapon) return '';

          // Process version string
          const versionParts = versionData.version.split('_').map(Number);
          const verString = `VER ${versionParts[0]}.${versionParts[1]}`;
          const upString = `UP ${versionParts[2]}`;

          // Get pool info for date range
          let dateRange = '202X.XX.XX - 202X.XX.XX';
          const formatDate = (timestamp: string | number) => {
            const date = new Date(Number(timestamp) * 1000);
            return (
              date.getFullYear() +
              '.' +
              String(date.getMonth() + 1).padStart(2, '0') +
              '.' +
              String(date.getDate()).padStart(2, '0')
            );
          };

          // Try to find special pool info first by constructing pool_id
          const specialPoolId = `special_${versionData.version}`;
          let poolInfo = poolInfoList.find((p) => p.pool_id === specialPoolId);

          if (!poolInfo) {
            try {
              // Fetch pool info from API
              const poolUrl = new URL('/api/endfield/gacha/pool-chars', cfg.apiBaseUrl);
              const poolResponse = await axios.get(poolUrl.toString(), {
                params: {
                  pool_id: specialPoolId,
                },
                headers: {
                  'X-API-KEY': cfg.apiKey,
                },
              });

              if (poolResponse.data.code === 0 && poolResponse.data.data.pools.length > 0) {
                const fetchedPool = poolResponse.data.data.pools[0];

                // Check if there's a pool with the same name in poolInfoList
                const existingPool = poolInfoList.find((p) => p.name === fetchedPool.pool_name);

                if (existingPool) {
                  // Update existing pool with new pool_id
                  existingPool.pool_id = specialPoolId;
                  await ctx.database.set('endfield_char_pools_v2', existingPool.id, {
                    pool_id: specialPoolId,
                  });
                  poolInfo = existingPool;
                } else {
                  // If no existing pool, fetch and save all char pools
                  await import('../services/char-pools').then((module) => {
                    return module.fetchAndSaveCharPools(ctx, cfg);
                  });

                  // Get updated pool data from database
                  const updatedPools = await ctx.database.get('endfield_char_pools_v2', {});

                  // Check again for pool with the same name
                  const updatedExistingPool = updatedPools.find(
                    (p) => p.name === fetchedPool.pool_name
                  );
                  if (updatedExistingPool) {
                    updatedExistingPool.pool_id = specialPoolId;
                    await ctx.database.set('endfield_char_pools_v2', updatedExistingPool.id, {
                      pool_id: specialPoolId,
                    });
                    poolInfo = updatedExistingPool;
                  }
                }
              }
            } catch (error) {
              ctx.logger.error('Error fetching pool info:', error);
            }
          }

          // Handle weapon pool up information
          if (hasWeapon) {
            const weaponPoolId = versionData.weaponPool!.poolId;

            // Check if weapon pool info is already in database
            const existingWeaponPool = await ctx.database.get(
              'endfield_weapon_pools',
              weaponPoolId
            );

            if (existingWeaponPool.length === 0) {
              try {
                // Fetch weapon pool info from API
                const weaponPoolUrl = new URL('/api/endfield/gacha/pool-chars', cfg.apiBaseUrl);
                const weaponPoolResponse = await axios.get(weaponPoolUrl.toString(), {
                  params: {
                    pool_id: weaponPoolId,
                  },
                  headers: {
                    'X-API-KEY': cfg.apiKey,
                  },
                });

                if (
                  weaponPoolResponse.data.code === 0 &&
                  weaponPoolResponse.data.data.pools.length > 0
                ) {
                  const weaponPoolData = weaponPoolResponse.data.data.pools[0];

                  // Find up weapons (is_up: true)
                  const upWeapons = weaponPoolData.star6_chars.filter((char: any) => char.is_up);

                  // Prepare weapon pool data for database
                  const weaponPoolRecord = {
                    pool_id: weaponPoolId,
                    pool_name: weaponPoolData.pool_name as string,
                    up_weapons: upWeapons as Array<{
                      char_id: string;
                      name: string;
                      cover: string;
                      rarity: number;
                      is_up: boolean;
                    }>,
                  };

                  // Save to database
                  await ctx.database.upsert('endfield_weapon_pools', [weaponPoolRecord]);
                }
              } catch (error) {
                ctx.logger.error('Error fetching weapon pool info:', error);
              }
            }
          }

          let dominantColor = '#ff3860';
          if (poolInfo) {
            const startDate = formatDate(poolInfo.pool_start_at_ts);
            const endDate = formatDate(poolInfo.pool_end_at_ts);
            dateRange = `${startDate} - ${endDate}`;

            dominantColor = poolInfo.dominant_color;
          }

          const content = [];
          if (hasSpecial) content.push(renderPoolCard(versionData.specialPool!, dominantColor));
          if (hasWeapon) content.push(renderPoolCard(versionData.weaponPool!, dominantColor));

          const result = content.join('');

          return `
            <div class="level mb-4 has-background-light p-3" style="border-left: 5px solid ${dominantColor};"> <div class="level-left">
                <div class="level-item">
                  <h2 class="title is-4 is-flex is-align-items-center">
                    <span class="tag is-black is-medium mr-4">${verString}</span>
                    ${upString}
                  </h2>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <span class="has-text-grey is-size-7">${dateRange}</span>
                </div>
              </div>
            </div>${result}`;
        })
      ).then((htmlParts) => htmlParts.join(''))}
    </div>
    `
        : ''
    }

    <!-- Other Special Pools -->
    ${
      specialPools.length > 0
        ? `
    <div class="divider" data-label="限定卡池"></div>
    <div class="columns is-multiline m-1">
      ${specialPools.map((p) => renderPoolCard(p)).join('')}
    </div>
    `
        : ''
    }

    <!-- Other Weapon Pools -->
    ${
      weaponPools.length > 0
        ? `
    <div class="divider" data-label="常驻武器申领"></div>
    <div class="level is-mobile px-2 m-1 mb-2">
        <div class="level-left has-text-grey is-size-7">常驻武器池总计：${categoryStats.weapon.pulls} 抽</div>
        <div class="level-right has-text-weight-bold is-size-7">平均花费：${weaponAvg} / 六星</div>
    </div>
    <div class="columns is-multiline m-1">
      ${weaponPools.map((p) => renderPoolCard(p)).join('')}
    </div>
    `
        : ''
    }

    <!-- Other Pools -->
    ${
      otherPools.length > 0
        ? `
    <div class="divider" data-label="常驻 / 新手"></div>
    <div class="columns is-multiline m-1">
      ${otherPools.map((p) => renderPoolCard(p)).join('')}
    </div>
    `
        : ''
    }
  </div>
</body>
</html>
  `;
}

export async function renderGachaRecord(
  ctx: Context,
  cfg: Config,
  cardData: any,
  poolData: any
): Promise<string> {
  const { puppeteer } = ctx;

  const html = await generateGachaRecord(ctx, cfg, cardData, poolData);
  return puppeteer.render(html);
}
