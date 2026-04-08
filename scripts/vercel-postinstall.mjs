import { spawnSync } from 'node:child_process';

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  process.exit(0);
}

const run = (args) => {
  const result = spawnSync('pnpm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(['--filter', '@context-passport/shared', 'build']);
run(['--filter', '@context-passport/backend', 'build']);
run(['exec', 'ncc', 'build', 'backend/dist/backend/src/app.js', '-o', '.server-bundle', '--no-cache']);
