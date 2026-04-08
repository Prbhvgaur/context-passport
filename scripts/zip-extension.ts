import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const scriptsRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = dirname(scriptsRoot);
const sourceDir = join(workspaceRoot, 'extension', 'dist');
const releaseDir = join(workspaceRoot, 'release');
const archivePath = join(releaseDir, 'context-passport-extension-v1.0.0.zip');

const main = async () => {
  await mkdir(releaseDir, { recursive: true });

  const output = createWriteStream(archivePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(sourceDir, false);
  await archive.finalize();
};

void main();
