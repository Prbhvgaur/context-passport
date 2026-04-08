import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';

const sizes = [16, 48, 128] as const;
const outputDir = join(process.cwd(), 'extension', 'public', 'icons');

const drawIcon = (size: number) => {
  const canvas = createCanvas(size, size);
  const context = canvas.getContext('2d');

  context.fillStyle = '#020617';
  context.beginPath();
  context.roundRect(0, 0, size, size, size * 0.26);
  context.fill();

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(1, '#10B981');
  context.fillStyle = gradient;
  context.beginPath();
  context.roundRect(size * 0.12, size * 0.12, size * 0.76, size * 0.76, size * 0.22);
  context.fill();

  context.fillStyle = '#EFF6FF';
  context.font = `700 ${Math.round(size * 0.34)}px Inter, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('CP', size / 2, size / 2 + size * 0.03);

  return canvas.encode('png');
};

const main = async () => {
  await mkdir(outputDir, { recursive: true });

  await Promise.all(
    sizes.map(async (size) => {
      const png = await drawIcon(size);
      await writeFile(join(outputDir, `icon-${size}.png`), png);
    }),
  );
};

void main();

