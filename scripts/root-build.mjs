import { spawnSync } from 'node:child_process';

const command =
  process.env.VERCEL === '1'
    ? 'pnpm --filter @context-passport/shared build && pnpm --filter @context-passport/backend build && pnpm --filter @context-passport/extension build && pnpm exec ncc build backend/dist/backend/src/app.js -o .server-bundle --no-cache && node scripts/fix-server-bundle.mjs && node scripts/prepare-public-demo.mjs'
    : 'pnpm -r build && pnpm exec ncc build backend/dist/backend/src/app.js -o .server-bundle --no-cache && node scripts/fix-server-bundle.mjs && node scripts/prepare-public-demo.mjs';

const result = spawnSync(command, {
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
