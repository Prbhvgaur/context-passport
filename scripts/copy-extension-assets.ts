import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(scriptsRoot);
const extensionRoot = join(workspaceRoot, 'extension');
const distRoot = join(extensionRoot, 'dist');

const main = async () => {
  await mkdir(distRoot, { recursive: true });
  await cp(join(extensionRoot, 'public'), distRoot, { recursive: true });

  const manifest = await readFile(join(extensionRoot, 'manifest.json'), 'utf8');
  await writeFile(join(distRoot, 'manifest.json'), manifest, 'utf8');
};

void main();
