import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceDir = resolve('extension', 'dist');
const demoDir = resolve('public', 'demo');
const popupPath = resolve(sourceDir, 'popup.html');
const demoIndexPath = resolve(demoDir, 'index.html');

await mkdir(demoDir, { recursive: true });
await cp(sourceDir, demoDir, {
  recursive: true,
  force: true,
});

const popupHtml = await readFile(popupPath, 'utf8');
await writeFile(demoIndexPath, popupHtml);
