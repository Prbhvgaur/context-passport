import type { IncomingMessage, ServerResponse } from 'node:http';
import { getRequestOrigin } from '../src/public-site.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = getRequestOrigin(req);

  res.statusCode = 200;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      success: true,
      data: {
        name: 'ContextPassport API',
        docs: `${origin}/api/docs`,
        openapi: `${origin}/api/openapi`,
        version: `${origin}/api/v1`,
        health: `${origin}/api/v1/health`,
      },
    }),
  );
}
