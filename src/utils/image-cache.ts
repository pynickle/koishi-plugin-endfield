import { createHash } from 'crypto';
import fs from 'fs/promises';
import { tmpdir } from 'os';
import { extname, join } from 'path';

import axios from 'axios';
import { Context } from 'koishi';

const CACHE_DIR = join(tmpdir(), 'endfield-image-cache');

function normalizeUrl(url: string) {
  return url ? url.replace(/^<|>/g, '') : '';
}

function getExtension(url: string) {
  try {
    const urlObj = new URL(url);
    const extension = extname(urlObj.pathname);
    if (extension && extension.length <= 5) return extension;
  } catch {
    return '.png';
  }
  return '.png';
}

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

export async function cacheImage(ctx: Context, url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  if (!normalized) return '';

  await ensureCacheDir();
  const hash = createHash('sha256').update(normalized).digest('hex');
  const extension = getExtension(normalized);
  const targetPath = join(CACHE_DIR, `${hash}${extension}`);

  try {
    await fs.access(targetPath);
    return `file:///${targetPath.replace(/\\/g, '/')}`;
  } catch {
    return await downloadToCache(ctx, normalized, targetPath);
  }
}

async function downloadToCache(ctx: Context, url: string, targetPath: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });
    await fs.writeFile(targetPath, response.data);
    return `file:///${targetPath.replace(/\\/g, '/')}`;
  } catch (error) {
    ctx.logger.warn(`Failed to cache image: ${url}`, error);
    return url;
  }
}

export async function cacheImages(
  ctx: Context,
  urls: string[],
  concurrency: number = 6
): Promise<Map<string, string>> {
  const normalized = Array.from(new Set(urls.map((url) => normalizeUrl(url)).filter(Boolean)));
  const result = new Map<string, string>();
  let index = 0;

  const worker = async () => {
    while (index < normalized.length) {
      const current = normalized[index];
      index += 1;
      const cached = await cacheImage(ctx, current);
      result.set(current, cached);
    }
  };

  const workers = Array.from({ length: Math.max(1, concurrency) }).map(() => worker());
  await Promise.all(workers);
  return result;
}
