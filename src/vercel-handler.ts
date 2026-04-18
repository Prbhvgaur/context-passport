import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => void;

let appPromise: Promise<NodeHandler> | null = null;

const loadApp = async (): Promise<NodeHandler> => {
  const bundleCandidates = [
    resolve(__dirname, '..', '.server-bundle', 'index.js'),
    resolve(process.cwd(), '.server-bundle', 'index.js'),
  ];

  appPromise ??= (async () => {
    let lastError: unknown;

    for (const candidate of bundleCandidates) {
      try {
        const mod = await import(pathToFileURL(candidate).href);
        const createApp =
          (typeof mod.createApp === 'function' ? mod.createApp : null) ??
          (typeof mod.default === 'function' ? mod.default : null) ??
          (typeof mod.default?.createApp === 'function' ? mod.default.createApp : null);

        if (!createApp) {
          throw new Error(`Bundle at ${candidate} does not export createApp().`);
        }

        return createApp() as unknown as NodeHandler;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  })();

  return appPromise;
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await loadApp();
    return app(req, res);
  } catch (error) {
    console.error('Failed to bootstrap Vercel handler', error);

    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: 'BOOTSTRAP_FAILED',
          message: error instanceof Error ? error.message : 'Unknown bootstrap error.',
        },
      }),
    );
  }
}
