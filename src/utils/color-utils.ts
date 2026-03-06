import axios from 'axios';
import ColorThief from 'colorthief';
import fs from 'fs/promises';
import { Context } from 'koishi';
import { tmpdir } from 'os';
import { join, extname } from 'path';
import { randomUUID } from 'node:crypto';

export async function getDominantColor(
  ctx: Context,
  imageUrl: string,
  quality: number = 10
): Promise<string> {
  if (!imageUrl) return null;

  let tempPath: string | null = null;

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    const buffer = response.data;

    const urlObj = new URL(imageUrl);
    let extension = extname(urlObj.pathname);
    if (!extension || extension.length > 5) extension = '.png';

    tempPath = join(tmpdir(), `colorthief-temp-${randomUUID()}${extension}`);

    await fs.writeFile(tempPath, buffer);

    const color = await ColorThief.getColor(tempPath, quality);

    return `#${color[0].toString(16).padStart(2, '0')}${color[1].toString(16).padStart(2, '0')}${color[2].toString(16).padStart(2, '0')}`;
  } catch (err) {
    ctx.logger.error(`Failed to get Dominate Color (${imageUrl}):`, err);
    return null;
  } finally {
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch (unlinkErr) {
        ctx.logger.warn(`Failed to remove temp dir (${tempPath}):`, unlinkErr);
      }
    }
  }
}
