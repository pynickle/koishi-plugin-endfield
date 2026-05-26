import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'lib/index.cjs',
  format: 'cjs',
  platform: 'node',
  external: [
    'koishi',
    'axios',
    'colorthief',
    'dayjs',
    'koishi-plugin-cron',
    'koishi-plugin-puppeteer',
  ],
});
