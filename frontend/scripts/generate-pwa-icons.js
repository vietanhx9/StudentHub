import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

const sources = [
  { svg: 'pwa-icon.svg', sizes: [192, 512], suffix: '' },
  { svg: 'pwa-icon-maskable.svg', sizes: [512], suffix: '-maskable' },
];

const appleTouchSize = 180;

async function run() {
  for (const { svg, sizes, suffix } of sources) {
    const buf = await readFile(resolve(publicDir, svg));
    for (const size of sizes) {
      const out = resolve(publicDir, `pwa-icon-${size}${suffix}.png`);
      await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out);
      console.log(`✓ ${out}`);
    }
  }
  const mainSvg = await readFile(resolve(publicDir, 'pwa-icon.svg'));
  const appleOut = resolve(publicDir, 'apple-touch-icon.png');
  await sharp(mainSvg, { density: 384 }).resize(appleTouchSize, appleTouchSize).png().toFile(appleOut);
  console.log(`✓ ${appleOut}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
