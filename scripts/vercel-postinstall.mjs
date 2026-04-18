import { spawnSync } from 'node:child_process';

const isVercel = process.env.VERCEL === '1';
const pnpmExecPath = process.env.npm_execpath;

if (!isVercel) {
  process.exit(0);
}

const run = (args) => {
  const command = pnpmExecPath ? process.execPath : process.platform === 'win32' ? 'pnpm' : 'pnpm';
  const commandArgs = pnpmExecPath ? [pnpmExecPath, ...args] : args;

  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: !pnpmExecPath,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(['--filter', '@context-passport/shared', 'build']);
run(['--filter', '@context-passport/backend', 'build']);
run(['exec', 'ncc', 'build', 'backend/dist/backend/src/app.js', '-o', '.server-bundle', '--no-cache']);
run(['exec', 'node', 'scripts/fix-server-bundle.mjs']);
