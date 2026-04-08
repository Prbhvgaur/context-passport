import express from 'express';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type ExpressApp = ReturnType<typeof express>;

const bundlePath = path.join(process.cwd(), '.server-bundle', 'index.js');
const bundleUrl = pathToFileURL(bundlePath).href;
const appPromise = import(bundleUrl).then((module) => {
  const createApp = (module as { createApp?: () => ExpressApp }).createApp;

  if (!createApp) {
    throw new Error('createApp export missing from server bundle');
  }

  return createApp();
});

const app = express();

app.use(async (req, res, next) => {
  try {
    const loadedApp = await appPromise;
    loadedApp(req, res, next);
  } catch (error) {
    next(error);
  }
});

export default app;
