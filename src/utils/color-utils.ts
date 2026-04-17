import fs from 'fs/promises';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'os';
import { join, extname } from 'path';

import axios from 'axios';
import { getColor } from 'colorthief';
import { Context } from 'koishi';

import { logPluginError, logPluginWarn } from '../core/errors';

export async function getDominantColor(
  ctx: Context,
  imageUrl: string,
  quality: number = 10
): Promise<string | null> {
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

    const color = await getColor(tempPath, { quality });
    if (!color) {
      ctx.logger.warn(`Failed to get dominant color (${imageUrl}): extractor returned null`);
      return null;
    }

    return color.hex();
  } catch (err) {
    logPluginError(ctx, 'Failed to extract dominant color', err, {
      imageUrl,
      quality,
    });
    return null;
  } finally {
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch (unlinkErr) {
        logPluginWarn(ctx, 'Failed to remove temporary image file. Continuing cleanup.', unlinkErr, {
          tempPath,
        });
      }
    }
  }
}
