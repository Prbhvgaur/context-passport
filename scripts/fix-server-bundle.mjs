import { mkdir, readFile, writeFile } from 'node:fs/promises';

const bundleDirectory = '.server-bundle';
const bundleEntryPath = `${bundleDirectory}/index.js`;
const packageJsonPath = `${bundleDirectory}/package.json`;
const dirnameShim = [
  "import { dirname } from 'node:path';",
  "import { fileURLToPath } from 'node:url';",
  'const __filename = fileURLToPath(import.meta.url);',
  'const __dirname = dirname(__filename);',
  '',
].join('\n');

await mkdir(bundleDirectory, { recursive: true });

const bundleSource = await readFile(bundleEntryPath, 'utf8');
const nextBundleSource = bundleSource.includes('const __dirname = dirname(__filename);')
  ? bundleSource
  : `${dirnameShim}${bundleSource}`;

await writeFile(bundleEntryPath, nextBundleSource);
await writeFile(
  packageJsonPath,
  JSON.stringify(
    {
      type: 'module',
    },
    null,
    2,
  ),
);
